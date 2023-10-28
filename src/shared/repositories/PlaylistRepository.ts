import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export class PlaylistRepository {
  private dynamo: DynamoDBDocumentClient;

  constructor(dynamo: DynamoDBDocumentClient) {
    this.dynamo = dynamo;
  }

  async getAllPlaylists() {}

  async getSinglePlaylist() {}

  async updateSinglePlaylist() {}

  async createPlaylistVersion() {}
}
