# ── Stage 1: Build the app ────────────────────────────────
FROM node:20-alpine AS builder

RUN npm install -g pnpm@10

WORKDIR /workspace

# Copy workspace root config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY tsconfig.base.json ./

# Copy package sources needed for this example
COPY packages/core/ packages/core/
COPY packages/vite/ packages/vite/
COPY packages/cli/ packages/cli/
COPY examples/vite-basic/ examples/vite-basic/

RUN pnpm install --frozen-lockfile
RUN pnpm -r --filter '@clientshell/core' --filter '@clientshell/vite' build
RUN pnpm --filter 'example-vite-basic' build

# ── Stage 2: Serve with clientshell ──────────────────────
FROM clientshell

COPY --from=builder /workspace/examples/vite-basic/dist /app/dist
