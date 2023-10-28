import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { Playlist, PlaylistedTrack } from "@spotify/web-api-ts-sdk";
import {
  GetAllPlaylistResponse,
  GetSinglePlaylistResponse,
} from "../contracts";

export class PlaylistRepository {
  private dynamo: DynamoDBDocumentClient;

  constructor(dynamo: DynamoDBDocumentClient) {
    this.dynamo = dynamo;
  }

  async getAllPlaylists(): Promise<GetAllPlaylistResponse> {
    const allPlaylists = await this.dynamo.send(
      new QueryCommand({
        TableName: process.env.DYNAMO_TABLE_NAME,
        IndexName: "Playlist_GSI",
        KeyConditionExpression: "#SortKey = :playlistSortKey",
        ExpressionAttributeNames: { "#SortKey": "SortKey" },
        ExpressionAttributeValues: { ":playlistSortKey": "Playlist#" },
      })
    );
    return allPlaylists.Items?.map(
      (item) => item.Data
    ) as GetAllPlaylistResponse;
  }

  async getSinglePlaylist(
    playlistId: string
  ): Promise<GetSinglePlaylistResponse | null> {
    const playlist = await this.dynamo.send(
      new GetCommand({
        TableName: process.env.DYNAMO_TABLE_NAME,
        Key: { PartitionKey: `Playlist#${playlistId}`, SortKey: "Playlist#" },
      })
    );

    if (!playlist.Item) return null;

    const playlistVersions = await this.dynamo.send(
      new QueryCommand({
        TableName: process.env.DYNAMO_TABLE_NAME,
        KeyConditionExpression:
          "#PartitionKey = :playlistPartitionKey and begins_with(#SortKey, :versionSortKey)",
        ExpressionAttributeNames: {
          "#PartitionKey": "PartitionKey",
          "#SortKey": "SortKey",
        },
        ExpressionAttributeValues: {
          ":playlistPartitionKey": `Playlist#${playlistId}`,
          ":versionSortKey": "Version#",
        },
      })
    );

    return {
      playlist: playlist.Item.Data,
      playlistVersions: playlistVersions.Items?.map((item) => item.Data),
    } as GetSinglePlaylistResponse;
  }

  async updateSinglePlaylist(playlist: Omit<Playlist, "tracks">) {
    await this.dynamo.send(
      new PutCommand({
        TableName: process.env.DYNAMO_TABLE_NAME,
        Item: {
          PartitionKey: `Playlist#${playlist.id}`,
          SortKey: "Playlist#",
          Data: playlist,
        },
      })
    );
  }

  async createPlaylistVersion(playlistId: string, tracks: PlaylistedTrack[]) {
    await this.dynamo.send(
      new PutCommand({
        TableName: process.env.DYNAMO_TABLE_NAME,
        Item: {
          PartitionKey: `Playlist#${playlistId}`,
          SortKey: `Version#${uuidv4()}`,
          Data: {
            versionDate: new Date().toISOString(),
            tracks: tracks,
          },
        },
      })
    );
  }
}
