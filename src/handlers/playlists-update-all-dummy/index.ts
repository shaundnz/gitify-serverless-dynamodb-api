import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  endpoint: process.env.DYNAMO_ENDPOINT,
});

const dynamo = DynamoDBDocumentClient.from(client);

interface EventPayload {
  jobId: string;
}

export const handler = async (event: EventPayload) => {
  return `Ran async update with jobId: ${event.jobId}`;
};
