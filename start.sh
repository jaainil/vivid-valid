#!/bin/sh
set -e

echo "==> [start.sh] Ensuring nginx required directories exist..."
mkdir -p /run/nginx
mkdir -p /var/cache/nginx
mkdir -p /var/log/nginx
mkdir -p /var/lib/nginx/tmp
mkdir -p /var/lib/nginx/proxy

echo "==> [start.sh] Testing nginx configuration..."
nginx -t 2>&1
echo "==> [start.sh] nginx config OK"

echo "==> [start.sh] Starting Node.js backend on port 3000..."
PORT=3000 node /var/www/backend/server.js &
NODE_PID=$!
echo "==> [start.sh] Node.js PID: $NODE_PID"

echo "==> [start.sh] Waiting for backend to be ready..."
TRIES=0
until wget -q --spider http://localhost:3000/health 2>/dev/null; do
  TRIES=$((TRIES + 1))
  if [ "$TRIES" -ge 15 ]; then
    echo "==> [start.sh] ERROR: Backend did not start within 15 seconds!"
    exit 1
  fi
  echo "==> [start.sh] Waiting for backend... attempt $TRIES"
  sleep 1
done
echo "==> [start.sh] Backend is ready!"

echo "==> [start.sh] Starting nginx..."
exec nginx -g 'daemon off;'
