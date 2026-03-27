import { defineConfig } from "vite";
import { clientshellPlugin } from "@clientshell/vite";
import { defineSchema, string, boolean, number, json } from "@clientshell/core";

// We use the core schema for the Vite plugin (manifest generation)
// while the app itself uses the Zod schema for validation.
const coreSchema = defineSchema({
  API_URL: string({ required: true, description: "Public API base URL" }),
  APP_ENV: string({ defaultValue: "development" }),
  ENABLE_NEW_UI: boolean({ defaultValue: false }),
  POLL_INTERVAL_MS: number({ defaultValue: 5000 }),
  PUBLIC_FLAGS: json<Record<string, boolean>>({ defaultValue: {} }),
});

export default defineConfig({
  plugins: [
    clientshellPlugin({
      schema: coreSchema,
      prefix: "CLIENT_",
      devValues: {
        API_URL: "http://localhost:3000",
        APP_ENV: "development",
        PUBLIC_FLAGS: { beta: true },
      },
    }),
  ],
});
