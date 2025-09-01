#!/bin/sh

PORT=${PORT:-3000}

# Build command with optional API key
API_KEY_ARG=""
if [ -n "$API_TOKEN" ]; then
    API_KEY_ARG="--api-key $API_TOKEN"
fi

exec uvx mcpo --host 0.0.0.0 --port "$PORT" $API_KEY_ARG -- node build/stdio-server.js