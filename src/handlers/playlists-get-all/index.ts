import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
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

  const playlistRepository = new PlaylistRepository(dynamo);
  const allPlaylists = await playlistRepository.getAllPlaylists();

  return {
    body: JSON.stringify(allPlaylists),
    statusCode: 200,
  };
};
