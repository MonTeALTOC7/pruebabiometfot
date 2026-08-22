#!/usr/bin/env sh
cd "$(dirname "$0")"
if command -v node >/dev/null 2>&1; then
  node tools/local-server.mjs
elif command -v python3 >/dev/null 2>&1; then
  python3 -m http.server 4173 --bind 127.0.0.1
else
  echo "Se necesita Node.js o Python 3."
  exit 1
fi
