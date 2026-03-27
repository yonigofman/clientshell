# @clientshell/vite

Vite plugin for **clientshell** — automatic manifest output and dev stub.

## Install

```bash
pnpm add -D @clientshell/vite
```

## Usage

```ts
// vite.config.ts
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
      },
    }),
  ],
});
```

## What it does

- **Dev server**: Serves `/env-config.js` with stub values so local dev uses the same `window.__CLIENT_CONFIG__` contract.
- **Build**: Writes `clientshell.manifest.json` into the build output for the Go injector.
