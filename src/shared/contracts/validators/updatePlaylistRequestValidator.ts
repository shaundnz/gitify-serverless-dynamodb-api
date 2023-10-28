import { z } from "zod";

export const updatePlaylistRequestValidator = z.array(z.string());
