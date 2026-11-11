#!/usr/bin/env bash
# Re-takes every screenshot from a local copy of the app in demo mode (the Fieldfare Traders sample),
# then writes the WebP versions the site uses. See README.md in this folder.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p shots
OUT=shots DSF=2 node shoot.mjs "$@"
node imgs.mjs
echo "Screenshots updated in public/img/"
