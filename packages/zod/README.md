# @clientshell/zod

Zod adapter for **clientshell** — define runtime config schemas with [Zod](https://zod.dev).

## Install

```bash
pnpm add @clientshell/zod zod
```

## Usage

```ts
import { z } from "zod";
import { defineZodSchema, readEnvWithZod, createManifestFromZod } from "@clientshell/zod";

const clientEnvSchema = defineZodSchema({
  API_URL: z.string().url(),
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  ENABLE_NEW_UI: z.boolean().default(false),
  POLL_INTERVAL_MS: z.number().int().positive().default(5000),
});

// Read config with full Zod validation
export const clientEnv = readEnvWithZod(clientEnvSchema);

// Generate manifest for the Go injector
const manifest = createManifestFromZod(clientEnvSchema, {
  prefix: "CLIENT_",
});
```

## API

| Export | Description |
|--------|-------------|
| `defineZodSchema(shape)` | Identity wrapper for Zod schema shape |
| `createManifestFromZod(schema, opts?)` | Introspects Zod types to produce manifest |
| `readEnvWithZod(schema)` | Reads `window.__CLIENT_CONFIG__` with Zod validation |
