# clientshell

Inject public runtime config into compiled frontend apps at container startup—no rebuilding for each environment.

`clientshell` provides a typed browser API for configuration and an ultra-fast Go injector that bridges the gap between static builds (Vite, Webpack) and dynamic environment variables.

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

### 2. Configure Vite

```ts
import { clientshellPlugin } from "@clientshell/vite";
import { clientEnvSchema } from "./env.schema";

export default {
  plugins: [clientshellPlugin({ schema: clientEnvSchema })]
};
```

### 3. Read at runtime

```ts
import { readEnvFromShape } from "@clientshell/core";
import { clientEnvSchema } from "./env.schema";

const env = readEnvFromShape(clientEnvSchema);
console.log(env.API_URL); // Fully typed string
```

## Local Development

For development, the Vite plugin automatically serves a stub `/env-config.js` to the browser, so your code works exactly the same way it does in production.

```bash
pnpm install
pnpm build
pnpm dev --filter example-vite-basic
```

## Production & Docker

For production, build your app then use the `clientshell` Docker image:

```bash
docker build -t my-app -f docker/Dockerfile .
docker run -e CLIENT_API_URL=https://prod.api.com my-app
```

---

License: MIT
