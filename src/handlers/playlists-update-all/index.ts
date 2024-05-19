import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { updatePlaylistRequestValidator } from "../../shared/contracts/validators";
import {
  PlaylistRepository,
  UpdatePlaylistsJobStatusRepository,
} from "../../shared/repositories";
import { authorizeIncomingRequest } from "../../shared/auth/authorizeIncomingRequest";
import { UpdatePlaylistsJobStatus } from "../../shared/constants";

const client = new DynamoDBClient({
  endpoint: process.env.DYNAMO_ENDPOINT,
});

const dynamo = DynamoDBDocumentClient.from(client);

interface EventPayload {
  jobId: string;
  playlistIds: string[];
}

export const handler = async (event: EventPayload) => {
  const { jobId, playlistIds } = event;

  const playlistRepository = new PlaylistRepository(dynamo);
  const updatePlaylistsJobStatusRepository =
    new UpdatePlaylistsJobStatusRepository(dynamo);

  const sdk = SpotifyApi.withClientCredentials(
    process.env.SPOTIFY_CLIENT_ID,
    process.env.SPOTIFY_CLIENT_SECRET
  );

  const newVersionCreated: string[] = [];
  const noChange: string[] = [];

  try {
    await Promise.all(
      playlistIds.map(async (id) => {
        const res = await sdk.playlists.getPlaylist(id);
        const { tracks, ...playlistEntity } = res;
        await playlistRepository.updateSinglePlaylist(playlistEntity);

        const trackItems = tracks.items;
        let fetchedAllTracks = !tracks.next;
        let offset = 100;
        const limit = 50;

        while (!fetchedAllTracks) {
          const playlistTracksRes = await sdk.playlists.getPlaylistItems(
            id,
            undefined,
            undefined,
            limit,
            offset
          );
          trackItems.push(...playlistTracksRes.items);
          offset = offset + limit;
          fetchedAllTracks = !playlistTracksRes.next;
        }

        // https://developer.spotify.com/documentation/web-api/reference/get-list-users-playlists
        // Playlist tracks can be null if they have been removed
        const tracksItemsNullsRemoved = trackItems.filter((t) => !!t.track);

        const shouldCreateNewVersion =
          await playlistRepository.shouldCreateNewVersion(
            id,
            tracksItemsNullsRemoved
          );

        // If we do not create a new version, should still update the version date
        // Gives better UX as user feels latest playlist version is up to date, rather
        // than the last time a new version was created
        if (shouldCreateNewVersion) {
          // Empty the available market properties, these are unneeded and
          // take a large amount of storage space
          tracksItemsNullsRemoved.forEach((item) => {
            if ("track" in item.track) {
              item.track.available_markets = [];
              item.track.album.available_markets = [];
            }
          });
          await playlistRepository.createPlaylistVersion(
            id,
            tracksItemsNullsRemoved
          );
          newVersionCreated.push(id);
        } else {
          await playlistRepository.updateLatestVersionDate(id);
          noChange.push(id);
        }

        return playlistEntity;
      })
    );
  } catch (err) {
    await updatePlaylistsJobStatusRepository.updateJobStatus(
      jobId,
      UpdatePlaylistsJobStatus.ERROR
    );
    throw err;
  }

  await updatePlaylistsJobStatusRepository.updateJobStatus(
    jobId,
    UpdatePlaylistsJobStatus.SUCCESS
  );

  return JSON.stringify({
    message: "Successful playlist-update-all lambda invocation",
    updatedPlaylists: newVersionCreated,
    noChange: noChange,
  });
};
