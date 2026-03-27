# @clientshell/cli

CLI for **clientshell** — generate manifests, validate env vars, create dev stubs.

## Install

```bash
pnpm add -D @clientshell/cli
```

## Commands

### `clientshell manifest`

Generate a manifest JSON from a schema module:

```bash
clientshell manifest --schema src/env.schema.ts --output clientshell.manifest.json
```

### `clientshell validate`

Validate current env vars against a manifest:

```bash
clientshell validate --manifest clientshell.manifest.json
```

### `clientshell stub`

Generate a dev `env-config.js` stub from a manifest:

```bash
clientshell stub --manifest clientshell.manifest.json --output public/env-config.js
```
