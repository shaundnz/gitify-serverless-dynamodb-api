import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  QueryCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { Playlist, PlaylistedTrack } from "@spotify/web-api-ts-sdk";
import {
  GetAllPlaylistResponse,
  GetSinglePlaylistResponse,
  PlaylistVersion,
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

    let playlistVersions: PlaylistVersion[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined = undefined;

    do {
      const queryRes: QueryCommandOutput = await this.dynamo.send(
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
          ExclusiveStartKey: lastEvaluatedKey,
        })
      );

      lastEvaluatedKey = queryRes.LastEvaluatedKey;

      queryRes.Items?.forEach((item) => {
        playlistVersions.push(item.Data);
      });
    } while (lastEvaluatedKey !== undefined);

    return {
      playlist: playlist.Item.Data,
      playlistVersions: playlistVersions,
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

  async shouldCreateNewVersion(
    playlistId: string,
    tracks: PlaylistedTrack[]
  ): Promise<boolean> {
    const playlist = await this.getSinglePlaylist(playlistId);

    // Should not happen, since we always create the playlist or update it before this step
    // In any case, do not create a version if no playlist can be associated
    if (playlist === null) {
      return false;
    }

    // Previous version does not exist, need to create it
    if (playlist.playlistVersions.length < 1) {
      return true;
    }

    const sortedVersionsNewestFirst = [...playlist.playlistVersions].sort(
      (a, b) => {
        return b.versionDate.localeCompare(a.versionDate);
      }
    );

    const latestVersion = sortedVersionsNewestFirst[0];

    // Different lengths, something has changed
    if (latestVersion.tracks.length !== tracks.length) {
      return true;
    }

    const latestVersionSongIdsSet = new Set<string>();

    latestVersion.tracks.forEach((t) => {
      latestVersionSongIdsSet.add(t.track.id);
    });

    // If any tracks with ids that are not found in the set exist, something has changed
    const newSongsFound = tracks.some((t) => {
      return !latestVersionSongIdsSet.has(t.track.id);
    });

    return newSongsFound;
  }

  async updateLatestVersionDate(playlistId: string) {
    const playlist = await this.getSinglePlaylist(playlistId);

    // Should not happen, playlist should always be created before this method is run
    if (playlist === null) {
      return;
    }

    // Should not happen, if no version exist, it should be created
    if (playlist.playlistVersions.length < 1) {
      return;
    }

    const sortedVersionsNewestFirst = [...playlist.playlistVersions].sort(
      (a, b) => {
        return b.versionDate.localeCompare(a.versionDate);
      }
    );

    const latestVersion = sortedVersionsNewestFirst[0];

    await this.dynamo.send(
      new UpdateCommand({
        TableName: process.env.DYNAMO_TABLE_NAME,
        Key: {
          PartitionKey: `Playlist#${playlistId}`,
          SortKey: `Version#${latestVersion.versionId}`,
        },
        UpdateExpression: "SET #data.#versionDate = :newDate",
        ExpressionAttributeNames: {
          "#data": "Data",
          "#versionDate": "versionDate",
        },
        ExpressionAttributeValues: {
          ":newDate": new Date().toISOString(),
        },
      })
    );
  }

  async createPlaylistVersion(playlistId: string, tracks: PlaylistedTrack[]) {
    const versionId = uuidv4();

    await this.dynamo.send(
      new PutCommand({
        TableName: process.env.DYNAMO_TABLE_NAME,
        Item: {
          PartitionKey: `Playlist#${playlistId}`,
          SortKey: `Version#${versionId}`,
          Data: {
            versionId: versionId,
            versionDate: new Date().toISOString(),
            tracks: tracks,
          },
        },
      })
    );
  }
}
