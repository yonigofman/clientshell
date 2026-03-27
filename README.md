<p align="center">
  <img src="./apps/docs/public/logo.png" width="140" alt="clientshell logo" />
</p>

# clientshell

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![pnpm](https://img.shields.io/badge/pnpm-v10-blue)](https://pnpm.io/)
[![Docs](https://img.shields.io/badge/docs-fumadocs-indigo)](https://yonigofman.github.io/clientshell/)

Inject public runtime config into compiled frontend apps at container startup—no rebuilding for each environment.

`clientshell` provides a typed browser API for configuration and an ultra-fast Go injector that bridges the gap between static builds (Vite, Webpack) and dynamic environment variables.

### 📚 [Read the Documentation](https://yonigofman.github.io/clientshell/)


## Why clientshell?

Modern frontend tools pre-compile environment variables into the binary build. This forces a complete rebuild (CI/CD) when moving between staging and production. `clientshell` fixes this by:

1. **Defining a schema** in TypeScript (via `@clientshell/core` or `@clientshell/zod`).
2. **Generating a manifest** during the build phase.
3. **Injecting variables** at runtime using a Go binary (`/env-config.js`).
4. **Providing a typed API** in the browser that requires no extra dependencies.

## Monorepo Packages

| Package | Description |
| :--- | :--- |
| [`@clientshell/core`](./packages/core) | DSL for schema definitions and the browser-side runtime reader. |
| [`@clientshell/zod`](./packages/zod) | Adapter for using Zod to define and validate your config schemas. |
| [`@clientshell/vite`](./packages/vite) | Vite plugin to output manifests and serve dev stubs. |
| [`@clientshell/cli`](./packages/cli) | CLI for manual manifest generation and CI validation. |
| [`injector`](./runtime/injector) | Ultra-fast Go binary for container startup injection. |

## Quick Start

### 1. Define your schema

```ts
import { defineSchema, string, boolean } from "@clientshell/core";

export const clientEnvSchema = defineSchema({
  API_URL: string({ required: true }),
  ENABLE_BETA: boolean({ defaultValue: false }),
});
```

### 2. Configure your bundler

**A. Vite (`@clientshell/vite`)**

Vite natively imports `.ts` schema files:

```ts
import { clientshellPlugin } from "@clientshell/vite";
import { clientEnvSchema } from "./env.schema";

export default {
  plugins: [clientshellPlugin({ schema: clientEnvSchema })]
};
```

**B. Webpack (`@clientshell/webpack`) & Rollup (`@clientshell/rollup`)**

Because Webpack and Rollup config files run in plain Node.js and can't natively `require` `.ts` files, you point the plugin to a pre-generated manifest JSON file instead:

```js
// webpack.config.cjs
const { ClientshellWebpackPlugin } = require("@clientshell/webpack");

module.exports = {
  plugins: [
    new ClientshellWebpackPlugin({
      manifestPath: "./clientshell.manifest.json",
      devValues: { API_URL: "http://localhost:3000" }
    })
  ]
};
```

*(You generate `clientshell.manifest.json` using the [CLI](./packages/cli) before running the bundler).*

### 3. Read at runtime

```ts
import { readEnvFromShape } from "@clientshell/core";
import { clientEnvSchema } from "./env.schema";

const env = readEnvFromShape(clientEnvSchema);
console.log(env.API_URL); // Fully typed string
```

## Local Development

For development, the bundler plugins (Vite, Webpack) automatically serve or generate a stub `env-config.js` to the browser, so your code works exactly the same way it does in production.

```bash
pnpm install
pnpm build
pnpm dev --filter example-vite-basic
```

## Production & Docker

To use `clientshell` in production, you can use the `clientshell` image as a base for your own application in a multi-stage Dockerfile.

### Custom Dockerfile Example

```dockerfile
# 1. Build your app
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN pnpm install && pnpm build

# 2. Use clientshell as the runtime
FROM clientshell
# Copy files into the default clientshell root (/app/dist)
COPY --from=builder /app/dist /app/dist
```

Build and run with environment variables:

```bash
docker build -t my-app .

# Run with custom port and API URL
docker run -p 9000:9000 \
  -e CLIENTSHELL_PORT=9000 \
  -e CLIENT_API_URL=https://api.example.com \
  my-app
```

### Configuration Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `CLIENTSHELL_PORT` | `8080` | The port Caddy listens on. |
| `CLIENTSHELL_ROOT` | `/app/dist` | The root directory Caddy serves files from. |
| `CLIENTSHELL_MANIFEST` | `/app/dist/clientshell.manifest.json` | Path to the manifest for the injector. |
| `CLIENTSHELL_DEBUG` | `0` | Set to `1` for verbose log output. |

---

License: MIT
