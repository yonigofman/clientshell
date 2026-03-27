import { z } from "zod";
import { defineZodSchema } from "@clientshell/zod";

export const clientEnvSchema = defineZodSchema({
  API_URL: z.string().url(),
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  ENABLE_NEW_UI: z.boolean().default(false),
  POLL_INTERVAL_MS: z.number().int().positive().default(5000),
  PUBLIC_FLAGS: z.record(z.boolean()).default({}),
});
