# @clientshell/rollup

Rollup plugin for **clientshell**.

Automatically emits the `clientshell.manifest.json` file into your Rollup output directory during your build.

## Install

```bash
pnpm add -D @clientshell/rollup @clientshell/core @clientshell/cli
```

## The Workflow

Because Rollup config (`rollup.config.js`) usually runs in plain Node.js environment via CLI, we don't import the `.ts` schema file directly into the plugin configuration. Instead, we use the `clientshell` CLI to compile the schema into a JSON manifest first.

### 1. Define your schema

```ts
// src/env.schema.ts
import { defineSchema, string } from "@clientshell/core";

export const clientEnvSchema = defineSchema({
  API_URL: string({ required: true }),
});
```

### 2. Update your package.json scripts

Use `pnpm manifest` to generate the JSON file before building with Rollup, using `node --import tsx` to enable TypeScript support.

```json
{
  "scripts": {
    "manifest": "node --import tsx ./node_modules/@clientshell/cli/bin/clientshell.js manifest --schema src/env.schema.ts --output clientshell.manifest.json",
    "build": "pnpm manifest && rollup -c rollup.config.mjs"
  }
}
```

### 3. Setup Rollup

Point the plugin directly to the generated manifest!

```javascript
// rollup.config.mjs
import { clientshellPlugin } from "@clientshell/rollup";

export default {
  input: "src/main.ts",
  output: {
    dir: "dist",
    format: "es",
  },
  plugins: [
    clientshellPlugin({
      manifestPath: "./clientshell.manifest.json",
    }),
  ],
};
```

## What it does

- Copies the parsed `clientshell.manifest.json` into your Rollup destination output directory (e.g. `dist/clientshell.manifest.json`) at the end of the build.
