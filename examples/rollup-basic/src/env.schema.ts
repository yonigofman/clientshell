import { defineSchema, string, boolean, number } from "@clientshell/core";

export const clientEnvSchema = defineSchema({
  API_URL: string({ required: true, description: "Public API base URL" }),
  APP_ENV: string({ defaultValue: "development" }),
  ENABLE_NEW_UI: boolean({ defaultValue: false }),
  POLL_INTERVAL_MS: number({ defaultValue: 5000 }),
});
