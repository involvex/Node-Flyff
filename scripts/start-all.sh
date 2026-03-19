#!/usr/bin/env bash
# Start DB and servers (Unix/macOS)
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Starting Postgres via docker-compose..."
docker-compose up -d db

echo "Waiting for Postgres to accept connections on localhost:5432..."
MAX_WAIT=60
WAIT=0
while ! nc -z 127.0.0.1 5432; do
  sleep 1
  WAIT=$((WAIT+1))
  if [ "$WAIT" -ge "$MAX_WAIT" ]; then
    echo "Postgres did not become available within $MAX_WAIT seconds." >&2
    exit 1
  fi
done

echo "Building project (bun build)..."
bun install
bun build ./src/main.ts --outdir ./dist --target bun

echo "Starting servers: login, cluster, world"
# run in background
bun run src/main.ts login &
bun run src/main.ts cluster &
bun run src/main.ts world &

echo "All services started."
