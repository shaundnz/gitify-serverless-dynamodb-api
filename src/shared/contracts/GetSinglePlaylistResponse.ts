import { Playlist, PlaylistedTrack } from "@spotify/web-api-ts-sdk";

export interface GetSinglePlaylistResponse {
  playlist: Omit<Playlist, "tracks">[];
  playlistVersions: {
    versionDate: Date;
    tracks: PlaylistedTrack[];
  };
}
