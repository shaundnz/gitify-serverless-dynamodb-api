import { UpdatePlaylistsJobStatus } from "../constants";

export interface GetUpdatePlaylistsJobStatusResponse {
  jobId: string;
  status: UpdatePlaylistsJobStatus;
}
