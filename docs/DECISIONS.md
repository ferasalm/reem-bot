# Decisions

The owner's decisions: the **only** source for them. Loaded at every session start (CLAUDE.md).
Newest first; one dated entry each (`- YYYY-MM-DD — **what** (owner's words): details`). Never drop or reword an
entry: strike it through (`~~…~~`) and say what superseded it. `tools/doc-check.mjs` checks the format.

## Decision log (owner's decisions; newest first; never drop or reword an entry, mark it superseded instead)
- 2026-10-04 — **Switch voice and hearing off ElevenLabs; test Nano Banana Lite** (owner: "Let's try nano banana lite.
  Eleven labs credits are running out, we gotta do the switch to the best speech and recognition models. Im confused
  between Helena and Andromeda, need more explicit samples where they don't robotically say \"ha ha ha\""): her voice
  notes move to Workers AI aura-2 (`VOICE.PROVIDER` "aura", ElevenLabs only as the backup), his voice notes to Whisper
  (already on `dev`). Which aura voice: owner to pick (helena or andromeda); Claude's default until then: helena.
  *Supersedes "aura-2-en is a test only: her voice stays ElevenLabs" (entry below).*
- 2026-10-04 — **Speech recognition on Cloudflare; test aura-2-en and Nano Banana** (owner: "google safety filters
  are actually lenient, they're not strict, they're just random. Let's test them before judging. Go with your pick for
  speech recognition. Let's test aura-2-en, suggest a suitable voice and make it as expressive as appropriately
  possible."): his voice notes are heard by Workers AI Whisper large v3 turbo (Claude's pick, $0.0005 a minute), with
  ElevenLabs Scribe as the backup. Nano Banana is benched for lingerie (OpenRouter; Cloudflare's copy needs AI Gateway
  credits). ~~aura-2-en is a test only: her voice stays ElevenLabs until the owner picks.~~ (superseded the same day: the switch to aura-2, above)
- 2026-10-03 — **Deploy** (owner: "Deploy"): `dev` merged into `main`: night place pictures (`isDark`), ROOM without
  the reference's light, no bathroom in body-length mirror shots, `takeSelfie` ignoring bracketed pauses, the FLUX
  prompting skill in `.claude/settings.json`.
- 2026-10-03 — **Deploy** (owner: "Deploy"): `dev` merged into `main`: Lebanese Reem in Belmont, Basbousa "she", fixed
  places, bigger and more frequent pictures, the Workers AI cap of 28,000 neurons a day, the branch-delete button.
- 2026-10-03 — **Image and model providers: Cloudflare or OpenRouter only** (owner: "I already paid for cloudflare,
  we must use it, keep suggesting alternatives that can be used via cloudflare or openrouter. We will not stay for
  cloudflare's limits for lingerie, but we will not use another image service other than cloudflare or
  openrouter. We are looking for high-quality, low-cost, efficient models for text, pictures, and voice."):
  Claude keeps proposing better, cheaper models for text, pictures and voice, but only on Cloudflare Workers AI or
  OpenRouter. No Runware, fal.ai or other image service. Cloudflare's lingerie filter is not accepted as final: find
  a way inside these two (another model, another wording, another route).
  ~~Voice stays ElevenLabs until the owner says otherwise.~~ (superseded 2026-10-04: voice moves to aura-2) *Narrows the open question "another image provider" in HANDOFF.*
- 2026-10-03 — **Reem is Lebanese and lives in Belmont, MA** (owner: "She's Lebanese and lives in the US Boston MA
  around or within Belmont"): Claude's details, owner may change them: born in Beirut, family moved to North Jersey
  when she was ten; second-floor apartment in an old brick walk-up near Cushing Square; he lives across the hall;
  her clock is America/New_York; Lebanese Arabizi; beach weekends at Crane Beach. *Supersedes Egyptian/Zamalek.*
- 2026-10-03 — **Fixed places** (owner: "Add fixed locations pictures/references for each character's apartments"):
  her rooms, his rooms and the hallway between their doors look the same in every picture (`PICTURE.LOCATIONS`,
  reference pictures in `places.js`).
- 2026-10-03 — **More pictures, a curvier body, a better-looking picture without klein 9B** (owner: "more
  pictures", "a shapelier, curvy body"; klein 9B on Workers AI: "Too expensive, find alternatives"): chances about
  doubled (Claude's values), the body described in every prompt, 768x1024 pictures at the same price as 640x640.
- 2026-10-03 — **Branch clean-up button** (owner: "Add the button, I'll press it"): Actions > Delete retired
  branches deletes what `tools/retired-branches.txt` lists, `Worker.js` included; `face-candidates` stays.
- 2026-10-03 — **Basbousa is a she** (owner: "Basbousa is a she"): the persona says so; its texting example
  no longer calls her "him" (the likely source of the he/she drift seen live).
- 2026-10-03 — **Handbook restructured (option D of the SWOT analysis)** (owner: "Agree with 1 D and agree with 2
  and 3"): HANDOFF.md holds only the current state and is rewritten every session; this decision log moved word for
  word to `docs/DECISIONS.md` and is still the only source of the owner's decisions, loaded with HANDOFF.md and
  `docs/LESSONS.md` at every session start (`@` imports in CLAUDE.md); `docs/MAP.md` before any code change;
  history in `docs/CHANGELOG.md`. `tools/doc-check.mjs` runs in CI (sizes, dated decisions, effort on every next
  step, every file in the map) and `docs/QUALITY.md` records every `[live]` run. End of session: `/handoff`.
  *Supersedes "the decision log lives in HANDOFF.md".*
- 2026-10-03 — **Cloudflare Workers Paid** (owner subscribed; picked "B + A's guards" over waiting on the free
  plan, an OpenRouter klein fallback, Vertex AI's $300 trial and Segmind/Fal): pay $5/month, keep a daily money
  cap in code (`AI_BUDGET.DAILY_NEURONS` 28,000 = at most $0.20/day; Claude's value, tunable) and cap test runs
  by real usage. Never a second free account (Cloudflare's terms). *Supersedes "Cloudflare free tier only" in
  Pictures v2.*
- 2026-10-03 — **Deploy the Workers AI fixes** (owner: "Fix everything and fix the bot so everything works NOW"):
  out-of-neurons no longer read as unavailable, PICTURE_NEURONS 105, klein's seed back, hourly retry after
  "used up" (`OUT_RETRY_MS`, Claude's value). Not done: a non-Cloudflare image fallback (would change the
  "Cloudflare free tier only" decision of Pictures v2; owner's call).
- 2026-10-03 — **Picture fix approved and deployed** (owner: "Do Next step 000 (the picture fix I approved) ...
  then deploy"): a 3030 refusal never goes to the backup model; schnell without `seed`; the shot he names wins.
  ~~Klein without `seed` too~~ (Claude's misreading, reverted; see Status "Real cause").
- 2026-10-03 — **Fewer voice notes** (owner: "fix those bugs"): `VOICE.CHANCE` 0.1, `VOICE.SELF_CHOICE_GAP` 4
  (Claude's values, tunable on the panel). Not deployed.
- 2026-10-02 — **Deploy pictures v3** (owner: "merge and deploy").
- 2026-10-02 — **Under-16 replies: no prompt change** (owner: "ignore this completely keep it unchanged, I don't
  see it as a risk"), about her sometimes answering "what are you wearing" or teasing after "i'm 16" in live runs.
  The prompt and `LIMITS & OOC` stay as they are; the code still blocks pictures in a minor-flagged chat. Don't
  raise it again as an open item.
- 2026-10-02 — **Pictures v3 rules** (owner, while planning the shot catalog): pictures **may be sexualized by
  pose or wardrobe, never explicitly naked** (nothing that would certainly trip a safety filter); the SAFE
  "fully clothed, non-sexual" rule is **removed**. **Selfies**: the phone and the hand holding it are **not
  visible**; **mirror selfies**: hand and phone **visible**, the phone **always an iPhone**. Reem may send
  sexualized pictures **on her own** by context and mood, not only when asked. Kept: none after he says he's
  under 18, never OOC. *Supersedes "never sexual" in "Pictures v2" (which was Claude's proposal).*
- 2026-10-02 — **Deploy pictures v2** (owner: "Deploy").
- 2026-10-02 — **Pictures v2** (owner): **never the same picture twice** ("a hard no") → no photo pack, every
  picture drawn new; ~~**Cloudflare free tier only**~~ (superseded 2026-10-03: Workers Paid); **pictures follow the voice rules**, only how often is scaled
  to cost (voice clips in scenes → scene pictures too); agreed with Claude: never sexual, none after he says he's
  under 18. Image model (owner's pick of 2): **FLUX.2 klein + a reference face**. The face is chosen by Claude
  (owner: "address how you are going to get the face reference"); the owner can replace it with /face.
  *Supersedes the photo-pack part of "Pictures" below.*
- 2026-10-02 — **Pictures**: she sees his photos and sends selfies (owner: "patch reem-bot such that she may send
  pictures, selfies and understands sent selfies and images", free tiers preferred). Owner's picks: **vision =
  Cloudflare Workers AI** (over OpenRouter free / paid vision); **selfies = photo pack + FLUX drawn fallback** (over
  pack only, always drawn, Gemini image). *Supersedes "No photo vision" in the v8 standing rules.*
- 2026-10-02 — **Deploy her voice in person scenes.**
- 2026-10-02 — **Her voice in person scenes: on request + sometimes** (owner's pick of 4 options; the others were
  every scene reply, only on request, keep text-only).
- 2026-10-02 — **Deploy the faster replies** (owner: "Merge, deploy, and update handoff").
- 2026-10-02 — **No multi-minute waits**: immersion beats realistic delays (owner: "minutes of waiting kills the
  immersion"). No busy pauses; fast typing.
- 2026-10-02 — **Settings commands answer instantly** (owner: "Even slash commands take so long").
- 2026-10-02 — **Reem replies faster** (owner: "It's taking too long for her to respond"): timing values above.
- 2026-10-02 — **Shared branch `dev`** (GitHub default; the owner switches it in Settings > General > Default
  branch). Sessions may push finished, tested work to `dev` without asking. `main` stays = live.
- 2026-10-02 — **Clean-up**: close PR #6 (superseded by the integrated v10) and delete the superseded branches
  (`ccr-b7869b5d-d7yudi`, `ccr-75e7610d-6zkheu`, `ccr-b51a9ebf-j34yp9`, `claude/reem-llm-model-comparison-f27xor`,
  and the squash-merged `ccr-9d5bc032-5c585q`, `claude/reem-bot-cloudflare-deploy-6l42tq`). PR #6 closed. The
  branches couldn't be deleted from Claude's session (the git proxy refuses ref deletion): the owner deletes them on
  GitHub; until then they're in `tools/retired-branches.txt`.
- 2026-10-02 — **Deploy v10 now.**
- 2026-10-02 — Merge choices, listed to the owner with no objection (reversible any time): texts kept free of *actions*
  by code; history folds at 40 keeping 24; /auto drafts on DeepSeek; PR #6's lengths (scenes under 150 words,
  MAX_TOKENS 220/120/380).
- 2026-10-02 — **Resync**: one v10 combining DeepSeek + format guards + PR #6 features. Owner: "Yes" to DeepSeek
  still being the model, "Yes" to PR #6's features being part of v10.
- 2026-10-01 (~22:00, after the model bench) — **Chat model: `deepseek/deepseek-v4-flash`**, reasoning off,
  providers Novita → Baidu → Relace → StreamLake, never Azure, Alibaba, AtlasCloud or DeepInfra,
  `allow_fallbacks: false`. Memory on DeepSeek too. **Lunaris 8B is only the backup** (`LLM.BACKUP_MODEL`, one try
  when DeepSeek is down). Sampling unchanged (0.95 / min_p 0.1 / 1.05; Novita ignores min_p). Prompt fixes picked:
  (b) [voice] first + tags only in voice notes, (c) scenes in third person, (d) the act itself when he invites it,
  as NUDGES (SYSTEM_PROMPT untouched by that session). Fix (a) "no *actions* in texts" as a nudge was **not**
  picked (texts are still kept free of *actions* by code, from the format-guard session: confirm if unsure).
  Bench results: `tools/model-bench/FINDINGS.md`. *Supersedes "The AI model stays Lunaris 8B".*
- 2026-10-01 — **Never tone down explicitness**: prompt edits may only make INTIMACY more explicit; code guards fix
  format only, never content.
- 2026-10-01 — v10 commands (PR #6): /auto = draft with ✅ Send / 🔄 Another buttons; editing = reply-commands (no
  buttons under her messages); Basbousa = fluffy golden-brown tabby.
- 2026-10-01 — Voice: owner picked design A1, saved in ElevenLabs as "Reem" (`8SAEKgpGuII5UtUnpuYN`); eleven_v3
  gets only `stability` 0.5 (Natural). Real clip checked: tags performed, not read; no Arabizi digit spoken.
- Standing rules (from v8):
  - **`LIMITS & OOC` in SYSTEM_PROMPT stays word for word** (tests check it): never loosen or tighten it.
    Adult themes stay open and may turn explicit naturally.
  - ~~No photo vision (it would need a second model).~~ Superseded 2026-10-02 (Pictures, above). No deliberate typos. Emoji reactions: yes. Expressive voice
    (eleven_v3): strongly preferred.
  - Arabizi (ya3ni, 7abibi) is fine in texts, but **no digit may ever be spoken** in voice notes.
  - Don't merge to `main`, open a PR or deploy unless the owner asks. The owner decides models; Claude only advises.
  - Keep every tunable in `CONFIG` (a unit test checks each has a settings panel field). After any CONFIG change,
    run `node tools/build-panel.mjs` (CI checks the panel matches).
  - The owner is on Android with no computer: Claude runs every test itself (CI, `[live]` commits) and never asks
    the owner to run commands.
- ~~2026-10-01 (v8) — The AI model stays `sao10k/l3-lunaris-8b`.~~ Superseded by the DeepSeek decision above.

