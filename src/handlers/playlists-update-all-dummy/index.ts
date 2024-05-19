import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { UpdatePlaylistsJobStatusRepository } from "../../shared/repositories";
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
  const jobId = event.jobId;

  const updatePlaylistsJobStatusRepository =
    new UpdatePlaylistsJobStatusRepository(dynamo);

  await updatePlaylistsJobStatusRepository.updateJobStatus(
    jobId,
    UpdatePlaylistsJobStatus.SUCCESS
  );

  return `Ran async update with jobId: ${event.jobId}`;
};
