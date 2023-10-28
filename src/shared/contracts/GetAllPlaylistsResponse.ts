import { Playlist } from "@spotify/web-api-ts-sdk";

export type GetAllPlaylistResponse = Omit<Playlist, "tracks">[];
