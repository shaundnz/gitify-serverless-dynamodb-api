import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { authorizeIncomingRequest } from "../../shared/auth/authorizeIncomingRequest";
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

  const jobId = event.pathParameters?.id;

  if (!jobId) {
    return {
      body: JSON.stringify({
        message: "Invalid job id",
      }),
      statusCode: 400,
    };
  }

  const updatePlaylistsJobStatusRepository =
    new UpdatePlaylistsJobStatusRepository(dynamo);
  const jobStatus = await updatePlaylistsJobStatusRepository.getJobStatus(
    jobId
  );

  if (!jobStatus) {
    return {
      body: JSON.stringify({
        message: `Could not get job with id: ${jobId}`,
      }),
      statusCode: 404,
    };
  }

  return {
    body: JSON.stringify(jobStatus),
    statusCode: 200,
  };
};
