import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { updatePlaylistRequestValidator } from "../../shared/contracts/validators";
import { PlaylistRepository } from "../../shared/repositories";

const client = new DynamoDBClient({
  endpoint: process.env.DYNAMO_ENDPOINT,
});

const dynamo = DynamoDBDocumentClient.from(client);

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Validate payload
  const body = JSON.parse(event.body ?? "{}");
  const parseRes = updatePlaylistRequestValidator.safeParse(body);
  if (!parseRes.success) {
    return {
      body: JSON.stringify({
        message: "Playlist ids must be list of strings",
      }),
      statusCode: 400,
    };
  }

  const playlistRepository = new PlaylistRepository(dynamo);

  const sdk = SpotifyApi.withClientCredentials(
    process.env.SPOTIFY_CLIENT_ID,
    process.env.SPOTIFY_CLIENT_SECRET
  );

  await Promise.all(
    parseRes.data.map(async (id) => {
      const res = await sdk.playlists.getPlaylist(id, "US");
      const { tracks, ...playlistEntity } = res;
      await playlistRepository.updateSinglePlaylist(playlistEntity);

      const trackItems = tracks.items;
      let fetchedAllTracks = !tracks.next;
      let offset = 100;
      const limit = 50;

      while (!fetchedAllTracks) {
        const playlistTracksRes = await sdk.playlists.getPlaylistItems(
          id,
          "US",
          undefined,
          limit,
          offset
        );
        trackItems.push(...playlistTracksRes.items);
        offset = offset + limit;
        fetchedAllTracks = !playlistTracksRes.next;
      }

      await playlistRepository.createPlaylistVersion(id, trackItems);

      return playlistEntity;
    })
  );

  return {
    body: JSON.stringify({
      message: "Successful playlist-update-all lambda invocation",
    }),
    statusCode: 201,
  };
};
