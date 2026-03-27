#!/bin/sh
set -e

echo "[clientshell] Running env injector..."
clientshell-injector

echo "[clientshell] Starting Caddy..."
exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
