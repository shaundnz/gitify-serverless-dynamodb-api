import { Playlist, PlaylistedTrack } from "@spotify/web-api-ts-sdk";

export interface GetSinglePlaylistResponse {
  playlist: Omit<Playlist, "tracks">[];
  playlistVersions: PlaylistVersion[];
}

export interface PlaylistVersion {
  versionId: string;
  // Stored as ISO8601 string
  versionDate: string;
  tracks: PlaylistedTrack[];
}
