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

# App static files will be mounted/copied to /app/dist
WORKDIR /app/dist

# Default env vars
ENV CLIENTSHELL_MANIFEST=/app/dist/clientshell.manifest.json
ENV CLIENTSHELL_DIR=/app/dist

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost:8080/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
