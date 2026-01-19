import { z } from "zod";

export const localeSchema = z.enum(["en", "ja"]);
export type Locale = z.infer<typeof localeSchema>;