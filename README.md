# reem-bot

Source for the `reem-bot` Cloudflare Worker (Telegram bot `@reem_nabot`).

- `worker.js` – the Worker
- `wrangler.toml` – name, KV binding `REEM_KV` (namespace `reem`), queue `reem-inbox` (producer + consumer), and a 15-minute cron trigger that lets her text first
- `.github/workflows/deploy.yml` – deploys to Cloudflare on every push to `main` (or run it by hand from the Actions tab)

## Cloudflare login (one-time)

1. Cloudflare dashboard → My Profile → API Tokens → **Create Token** → template **Edit Cloudflare Workers** → add the permission **Account → Queues → Edit** (wrangler sets up the `reem-inbox` consumer on deploy) → pick your account → create, then copy the token.
2. GitHub → this repo → Settings → Secrets and variables → Actions → **New repository secret**:
   - `CLOUDFLARE_API_TOKEN` = the token
   - `CLOUDFLARE_ACCOUNT_ID` = your account ID (dashboard → Workers & Pages, right sidebar)

Bot secrets (`TELEGRAM_BOT_TOKEN`, `OPENROUTER_API_KEY`, `ELEVENLABS_API_KEY`, …) stay in the Cloudflare dashboard; deploys don't change them, and `keep_vars = true` keeps any plain-text dashboard variables too.

## Changing settings

Every adjustable value is in the **SETTINGS** section at the top of `worker.js` (`CONFIG`): character name and time zone, models and sampling, the ElevenLabs voice (ID, speed, stability, style…), speech-to-text language, typing/reading speed and other timing, the Telegram `/` commands, every message the bot sends, the prompt nudges, and limits. Edit a value there and push to `main`.

To change values without a deploy, add a variable `CONFIG_OVERRIDES` in the Cloudflare dashboard containing JSON with just the values to change, for example:

```json
{ "VOICE": { "SPEED": 1.05, "ID": "your-voice-id" }, "TIMING": { "TYPING_CHARS_PER_MIN": 200 } }
```

Objects are merged and lists are replaced whole. Open `/setup` afterwards to check the overrides were applied; it flags misspelled names. After changing `COMMANDS`, open `/setup` again so Telegram's command menu updates.

## Deploy

Merge to `main`, or Actions → **Deploy to Cloudflare** → Run workflow.

Locally: `CLOUDFLARE_API_TOKEN=... npx wrangler deploy`. Check the build without deploying: `npx wrangler deploy --dry-run --outdir dist`.

## Settings panel

`tools/settings-panel.html` is an offline page listing every setting with its current default. Open it in a browser, change what you want: changed fields turn yellow and show up in the **Changes to make** box at the top. Screenshot that box (or press **Copy changes for Claude**) to ask for the change, or press **Copy as CONFIG_OVERRIDES JSON** to apply it yourself in the Cloudflare dashboard. Your edits are remembered in the browser until you press **Reset everything**.

After changing `CONFIG` in `worker.js`, run `node tools/build-panel.mjs` so the panel's defaults match again.

## Tests

Every push runs the tests on GitHub (Actions tab → **Tests**). To also check the real model, add the repository secret `OPENROUTER_API_KEY` (Settings → Secrets and variables → Actions) and push a commit with `[live]` in its message, or use **Run workflow** once this is on `main`. Every reply it got is in the run's log.

Locally: `node tools/test/unit.mjs`, `node tools/test/scenarios.mjs`, `node tools/test/e2e.mjs` (prints a log to read), `OPENROUTER_API_KEY=... node tools/test/live.mjs`.
