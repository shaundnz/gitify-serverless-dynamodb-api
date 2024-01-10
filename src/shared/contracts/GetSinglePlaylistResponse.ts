import { Playlist, PlaylistedTrack, Track } from "@spotify/web-api-ts-sdk";

export interface GetSinglePlaylistResponse {
  playlist: Omit<Playlist, "tracks">[];
  playlistVersions: PlaylistVersionMinified[];
  playlistSongsMap: {
    [id: string]: Track;
  };
}

export interface PlaylistVersionMinified {
  versionId: string;
  versionDate: string;
  tracks: MinifiedPlaylistVersionTrack[];
}

export interface MinifiedPlaylistVersionTrack {
  id: string;
  added_at: string;
}

export interface PlaylistVersion {
  versionId: string;
  // Stored as ISO8601 string
  versionDate: string;
  tracks: PlaylistedTrack[];
}
