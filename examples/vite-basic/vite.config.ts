import { defineConfig } from "vite";
import { clientshellPlugin } from "@clientshell/vite";
import { clientEnvSchema } from "./src/env.schema";

export default defineConfig({
  plugins: [
    clientshellPlugin({
      schema: clientEnvSchema,
      prefix: "CLIENT_",
      devValues: {
        API_URL: "http://localhost:3000",
        APP_ENV: "development",
      },
    }),
  ],
});
