# clientshell injector

Go binary that reads a `clientshell.manifest.json` and environment variables, then generates `env-config.js` for the browser.

## Build

```bash
cd runtime/injector
go build -o clientshell-injector .
```

## Usage

```bash
./clientshell-injector \
  --manifest /app/clientshell.manifest.json \
  --dir /app/dist
```

Or via env vars:

```bash
CLIENTSHELL_MANIFEST=/app/clientshell.manifest.json \
CLIENTSHELL_DIR=/app/dist \
CLIENTSHELL_DEBUG=1 \
./clientshell-injector
```

## Test

```bash
go test -v -race ./...
```
