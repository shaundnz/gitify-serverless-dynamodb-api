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
  const playlistRepository = new PlaylistRepository(dynamo);
  const allPlaylists = await playlistRepository.getAllPlaylists();

  return {
    body: JSON.stringify(allPlaylists),
    statusCode: 200,
  };
};
