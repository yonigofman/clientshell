# @clientshell/webpack

Webpack plugin for **clientshell**. 

Automatically includes the generated clientshell manifest in your output bundle and provides a dev-mode stub for local development.

## Install

```bash
pnpm add -D @clientshell/webpack @clientshell/core @clientshell/cli
```

## The Workflow

Because Webpack config (`webpack.config.cjs`) usually runs in plain Node.js, we don't import the `.ts` schema file directly into the Webpack config. Instead, we use the `clientshell` CLI to compile the schema into a JSON manifest first.

### 1. Define your schema

```ts
// src/env.schema.ts
import { defineSchema, string } from "@clientshell/core";

export const clientEnvSchema = defineSchema({
  API_URL: string({ required: true }),
});
```

### 2. Update your package.json scripts

Use `pnpm manifest` to generate the JSON file before building with Webpack, making sure to use `node --import tsx` so you can load the TypeScript schema file.

```json
{
  "scripts": {
    "manifest": "node --import tsx ./node_modules/@clientshell/cli/bin/clientshell.js manifest --schema src/env.schema.ts --output clientshell.manifest.json",
    "build": "pnpm manifest && webpack --config webpack.config.cjs",
    "dev": "pnpm manifest && webpack serve --config webpack.config.cjs"
  }
}
```
*(Tip: In a monorepo, standard `clientshell manifest` usually works fine if tsx is configured globally or you run it via standard build runners.)*

### 3. Setup Webpack

Point the plugin directly to the generated manifest!

```javascript
// webpack.config.cjs
const { ClientshellWebpackPlugin } = require("@clientshell/webpack");

module.exports = {
  plugins: [
    new ClientshellWebpackPlugin({
      // Point the plugin to the generated manifest
      manifestPath: "./clientshell.manifest.json",

      // Overrides for development mode (Optional)
      devValues: {
        API_URL: "http://localhost:3000",
      },
    }),
  ],
};
```

## What it does

- **Build (`mode: "production"`)**: Copies `clientshell.manifest.json` into your output directory.
- **Dev (`mode: "development"`)**: Writes a stub `env-config.js` to the output directory using the defaults in your manifest, overlaid with your provided `devValues`.
