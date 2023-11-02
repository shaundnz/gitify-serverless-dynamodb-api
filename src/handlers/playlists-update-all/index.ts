import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { updatePlaylistRequestValidator } from "../../shared/contracts/validators";
import { PlaylistRepository } from "../../shared/repositories";
import { authorizeIncomingRequest } from "../../shared/auth/authorizeIncomingRequest";

const client = new DynamoDBClient({
  endpoint: process.env.DYNAMO_ENDPOINT,
});

const dynamo = DynamoDBDocumentClient.from(client);

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const authorized = authorizeIncomingRequest(event);
  if (!authorized) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: "Invalid API Key",
      }),
    };
  }

  // Validate payload
  const body = JSON.parse(event.body ?? "{}");
  const parseRes = updatePlaylistRequestValidator.safeParse(body);
  if (!parseRes.success) {
    return {
      body: JSON.stringify({
        message: "Playlist Ids must be list of strings",
      }),
      statusCode: 400,
    };
  }

  const playlistRepository = new PlaylistRepository(dynamo);

  const sdk = SpotifyApi.withClientCredentials(
    process.env.SPOTIFY_CLIENT_ID,
    process.env.SPOTIFY_CLIENT_SECRET
  );

  const newVersionCreated: string[] = [];
  const noChange: string[] = [];

  await Promise.all(
    parseRes.data.map(async (id) => {
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

      const shouldCreateNewVersion =
        await playlistRepository.shouldCreateNewVersion(id, trackItems);

      // If we do not create a new version, should still update the version date
      // Gives better UX as user feels latest playlist version is up to date, rather
      // than the last time a new version was created
      if (shouldCreateNewVersion) {
        // Empty the available market properties, these are unneeded and
        // take a large amount of storage space
        trackItems.forEach((item) => {
          if ("track" in item.track) {
            item.track.available_markets = [];
            item.track.album.available_markets = [];
          }
        });
        await playlistRepository.createPlaylistVersion(id, trackItems);
        newVersionCreated.push(id);
      } else {
        await playlistRepository.updateLatestVersionDate(id);
        noChange.push(id);
      }

      return playlistEntity;
    })
  );

  return {
    body: JSON.stringify({
      message: "Successful playlist-update-all lambda invocation",
      updatedPlaylists: newVersionCreated,
      noChange: noChange,
    }),
    statusCode: 201,
  };
};
