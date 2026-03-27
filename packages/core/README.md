# @clientshell/core

Core package for **clientshell** — typed public runtime config for frontend apps.

## Install

```bash
pnpm add @clientshell/core
```

## Usage

### Define a schema

```ts
import { defineSchema, string, boolean, number, json } from "@clientshell/core";

export const clientEnvSchema = defineSchema({
  API_URL: string({ required: true, description: "Public API base URL" }),
  APP_ENV: string({ defaultValue: "development" }),
  ENABLE_NEW_UI: boolean({ defaultValue: false }),
  POLL_INTERVAL_MS: number({ defaultValue: 5000 }),
  PUBLIC_FLAGS: json<Record<string, boolean>>({ defaultValue: {} }),
});
```

### Read config at runtime

```ts
import { readEnvFromShape } from "@clientshell/core";
import { clientEnvSchema } from "./env.schema";

export const clientEnv = readEnvFromShape(clientEnvSchema);
// clientEnv.API_URL → string (fully typed)
```

### Generate a manifest

```ts
import { createManifest } from "@clientshell/core";
import { clientEnvSchema } from "./env.schema";

const manifest = createManifest(clientEnvSchema, {
  prefix: "CLIENT_",
  windowObject: "__CLIENT_CONFIG__",
});
```

The manifest is the stable JSON contract consumed by the Go injector at container startup.

## API

| Export | Description |
|--------|-------------|
| `defineSchema(shape)` | Identity wrapper preserving full type info |
| `string(opts?)` | String field descriptor |
| `boolean(opts?)` | Boolean field descriptor |
| `number(opts?)` | Number field descriptor |
| `json<T>(opts?)` | JSON field descriptor with generic type |
| `createManifest(schema, opts?)` | Generates the manifest JSON |
| `readEnvFromShape(schema)` | Reads `window.__CLIENT_CONFIG__` with coercion |
