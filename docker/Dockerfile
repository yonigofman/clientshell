# ── Stage 1: Build Go injector ────────────────────────────
FROM golang:1.22-alpine AS builder

WORKDIR /build

COPY runtime/injector/go.mod ./
RUN go mod download

COPY runtime/injector/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /clientshell-injector .

# ── Stage 2: Caddy runtime ───────────────────────────────
FROM caddy:2-alpine

# Create non-root user
RUN adduser -D -u 1001 appuser

# Copy injector binary
COPY --from=builder /clientshell-injector /usr/local/bin/clientshell-injector

# Copy Caddyfile
COPY docker/Caddyfile /etc/caddy/Caddyfile

# Copy entrypoint
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Default env vars
ENV CLIENTSHELL_PORT=8080
ENV CLIENTSHELL_ROOT=/app/dist
ENV CLIENTSHELL_MANIFEST=/app/dist/clientshell.manifest.json
ENV CLIENTSHELL_DIR=/app/dist

WORKDIR ${CLIENTSHELL_ROOT}

EXPOSE ${CLIENTSHELL_PORT}

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost:${CLIENTSHELL_PORT}/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
