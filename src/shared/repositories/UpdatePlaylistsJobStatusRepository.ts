import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { UpdatePlaylistsJobStatus } from "../constants";
import { GetUpdatePlaylistsJobStatusResponse } from "../contracts";

export class UpdatePlaylistsJobStatusRepository {
  private dynamo: DynamoDBDocumentClient;

  constructor(dynamo: DynamoDBDocumentClient) {
    this.dynamo = dynamo;
  }

  async createJobStartedRecord(): Promise<string> {
    const jobId = uuidv4();
    const isoTimeNow = new Date().toISOString();

    await this.dynamo.send(
      new PutCommand({
        TableName: process.env.DYNAMO_TABLE_NAME,
        Item: {
          PartitionKey: `UpdatePlaylistJobStatus#${jobId}`,
          SortKey: `UpdatePlaylistsJobStatus#`,
          Data: {
            status: UpdatePlaylistsJobStatus.STARTED,
            startedAt: isoTimeNow,
            lastUpdatedAt: isoTimeNow,
          },
        },
      })
    );

    return jobId;
  }

  async updateJobStatus(jobId: string, newStatus: UpdatePlaylistsJobStatus) {
    await this.dynamo.send(
      new UpdateCommand({
        TableName: process.env.DYNAMO_TABLE_NAME,
        Key: {
          PartitionKey: `UpdatePlaylistJobStatus#${jobId}`,
        },
        UpdateExpression:
          "SET #data.#status = :newStatus, #data.#lastUpdatedAt = :lastUpdatedAt",
        ExpressionAttributeNames: {
          "#data": "Data",
          "#status": "status",
          "#lastUpdatedAt": "lastUpdatedAt",
        },
        ExpressionAttributeValues: {
          ":newStatus": newStatus,
          ":lastUpdatedAt": new Date().toISOString(),
        },
      })
    );
  }

  async getJobStatus(
    jobId: string
  ): Promise<GetUpdatePlaylistsJobStatusResponse | null> {
    const jobStatus = await this.dynamo.send(
      new GetCommand({
        TableName: process.env.DYNAMO_TABLE_NAME,
        Key: {
          PartitionKey: `UpdatePlaylistJobStatus#${jobId}`,
          SortKey: "UpdatePlaylistsJobStatus#",
        },
      })
    );

    if (!jobStatus.Item) {
      return null;
    }

    return {
      jobId: jobId,
      status: jobStatus.Item.Data.status as UpdatePlaylistsJobStatus,
    };
  }
}
