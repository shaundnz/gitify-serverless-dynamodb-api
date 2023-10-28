import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PlaylistRepository } from "../../shared/repositories";

const client = new DynamoDBClient({
  endpoint: process.env.DYNAMO_ENDPOINT,
});

const dynamo = DynamoDBDocumentClient.from(client);

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const playlistId = event.pathParameters?.id;

  if (!playlistId) {
    return {
      body: JSON.stringify({
        message: "Invalid playlist id",
      }),
      statusCode: 400,
    };
  }

  const playlistRepository = new PlaylistRepository(dynamo);
  const playlist = await playlistRepository.getSinglePlaylist(playlistId);

  if (playlist === null) {
    return {
      body: JSON.stringify({
        message: `Could not get playlist with id: ${playlistId}`,
      }),
      statusCode: 404,
    };
  }

  return {
    body: JSON.stringify(playlist),
    statusCode: 200,
  };
};
