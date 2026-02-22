#!/bin/sh
set -e

missing=""
[ -z "$NEXTDNS_API_KEY" ] && missing="$missing NEXTDNS_API_KEY"
[ -z "$NEXTDNS_PROFILE_ID" ] && missing="$missing NEXTDNS_PROFILE_ID"

if [ -n "$missing" ]; then
  echo "ERROR: Missing required env vars:$missing" >&2
  echo "Pass them via --env-file .env or -e flags." >&2
  exit 1
fi

exec "$@"
