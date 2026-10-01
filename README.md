# reem-bot

Source for the `reem-bot` Cloudflare Worker (Telegram bot `@reem_nabot`).

- `worker.js` – the Worker
- `wrangler.toml` – name, KV binding `REEM_KV` (namespace `reem`), queue `reem-inbox` (producer + consumer)
- `.github/workflows/deploy.yml` – deploys to Cloudflare on every push to `main` (or run it by hand from the Actions tab)

## Cloudflare login (one-time)

1. Cloudflare dashboard → My Profile → API Tokens → **Create Token** → template **Edit Cloudflare Workers** → add the permission **Account → Queues → Edit** (wrangler sets up the `reem-inbox` consumer on deploy) → pick your account → create, then copy the token.
2. GitHub → this repo → Settings → Secrets and variables → Actions → **New repository secret**:
   - `CLOUDFLARE_API_TOKEN` = the token
   - `CLOUDFLARE_ACCOUNT_ID` = your account ID (dashboard → Workers & Pages, right sidebar)

Bot secrets (`TELEGRAM_BOT_TOKEN`, `OPENROUTER_API_KEY`, `ELEVENLABS_API_KEY`, …) stay in the Cloudflare dashboard; deploys don't change them, and `keep_vars = true` keeps any plain-text dashboard variables too.

## Deploy

Merge to `main`, or Actions → **Deploy to Cloudflare** → Run workflow.

Locally: `CLOUDFLARE_API_TOKEN=... npx wrangler deploy`. Check the build without deploying: `npx wrangler deploy --dry-run --outdir dist`.
