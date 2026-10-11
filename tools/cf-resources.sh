#!/usr/bin/env bash
# Makes the Cloudflare resources wrangler.toml binds, if they're missing (a deploy fails on a binding to a
# missing one). Runs in deploy.yml before the deploy, and by hand from Actions > Cloudflare resources.
# Needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID. Safe to run again: "already exists" is fine.
set -u
W="npx --yes wrangler@4.145.0"
# Long memory (CONFIG.RECALL): her and his past messages as bge-m3 vectors (1024 dims), searched by chat
out=$($W vectorize create reem-memory --dimensions=1024 --metric=cosine 2>&1); echo "$out"
echo "$out" | grep -qiE "created|already exists|duplicate" || exit 1
for p in chat who; do
  out=$($W vectorize create-metadata-index reem-memory --property-name=$p --type=string 2>&1); echo "$out"
  echo "$out" | grep -qiE "created|already exists|duplicate|success" || exit 1
done
$W vectorize info reem-memory
# The studio's log (STUDIO_DB, wrangler.toml; created with the Cloudflare MCP): a deploy binds it, so it must be visible here.
# Not created here: the schema is worker.js's STUDIO_SCHEMA, applied by the Worker on its first picture.
$W d1 info reem-studio || exit 1
