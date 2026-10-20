#!/bin/sh
set -eu

# Serialize only these public values; never expose the rest of the environment.
jq -cn \
  --arg enabled "${RYBBIT_ENABLED:-false}" \
  --arg endpoint "${RYBBIT_ENDPOINT:-}" \
  --arg siteId "${RYBBIT_SITE_ID:-}" \
  '{rybbit: {enabled: ($enabled == "true"), endpoint: $endpoint, siteId: $siteId}}' \
  > /usr/share/nginx/html/runtime-config.json.tmp
mv /usr/share/nginx/html/runtime-config.json.tmp /usr/share/nginx/html/runtime-config.json
