import { Playlist, PlaylistedTrack } from "@spotify/web-api-ts-sdk";

export interface GetSinglePlaylistResponse {
  playlist: Omit<Playlist, "tracks">[];
  playlistVersions: {
    versionId: string;
    // Stored as ISO8601 string
    versionDate: string;
    tracks: PlaylistedTrack[];
  }[];
}
