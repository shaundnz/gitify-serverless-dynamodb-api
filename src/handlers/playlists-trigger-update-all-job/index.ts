import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { authorizeIncomingRequest } from "../../shared/auth/authorizeIncomingRequest";
import { updatePlaylistRequestValidator } from "../../shared/contracts/validators";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { UpdatePlaylistsJobStatusRepository } from "../../shared/repositories";

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

  const updatePlaylistsJobStatusRepository =
    new UpdatePlaylistsJobStatusRepository(dynamo);

  const jobId =
    await updatePlaylistsJobStatusRepository.createJobStartedRecord();

  // Start the update job

  return {
    body: JSON.stringify({
      jobId: jobId,
    }),
    statusCode: 202,
  };
};
