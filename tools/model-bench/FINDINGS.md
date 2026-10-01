# Model bench findings (2026-10-01)

Two runs of `bench.mjs` through `.github/workflows/model-bench.yml` (GitHub Actions, `OPENROUTER_API_KEY` repo secret).
Spent $0.0168 (lean plan, every target) + $0.0047 (full plan, DeepSeek on Novita only) = **$0.0215**.
Every reply was read by hand: the automatic `heat` check in `checks.mjs` badly under-scores (it called fully explicit replies "tame"),
so ignore its ladder ceilings, and in the lean plan it makes the top-down ladder step down too early (only 1 reply per level).

## Decision
Owner chose **`deepseek/deepseek-v4-flash` with `reasoning: { enabled: false }`**, providers in this order:
**Novita → Baidu → Relace → StreamLake**; never Azure, Alibaba, AtlasCloud (they filter) or DeepInfra (rate-limited).
Applied in worker.js v10 (`CONFIG.LLM.PROVIDER`/`REASONING`, Lunaris as `BACKUP_MODEL`); its verification runs are summarized in HANDOFF.md.

## Models (same prompt, nudges and sampling as worker.js)
| Model | OK | Median | $ / 1k replies | Notes |
|---|---|---|---|---|
| DeepSeek V4 Flash @ Novita | 36/36 | 2.1s | $0.15 | Best writing, persona details, proactivity, carries scenes; safeguard passed 3/3; L4 delivered 6/6 (4 fully explicit); L3 tends to describe wants rather than the act |
| Ministral 14B | 13/13 | 1.6s | $0.13 | Forward, carries scenes, but worst format (*actions* in texts/voice, malformed tags); messy safeguard |
| Dolphin-Venice 24B | 14/14 | 1.5s | $0.41 | Hallucinated Arabic, nonsense lines, broke character in the safeguard; ruled out |
| Lunaris 8B (old) | 14/14 | 1.1s | $0.08 | Most graphic, but rambling, tags in texts, narrates the user; weakest writing |

## DeepSeek V4 Flash providers
| Provider | Result | Median | $ / 1k | Samplers (min_p / rep. penalty) |
|---|---|---|---|---|
| Novita | 36/36, never filtered, most explicit L4 | 2.1s | $0.15 | no / yes |
| Baidu | 4/4, explicit L4, 99.999% uptime | 1.8s | $0.08 | no / no |
| Relace (fp4) | 4/4, explicit L4, one stray `"."` | 1.5s | $0.12 | yes / yes |
| StreamLake | 4/4, only fully explicit L3 | 2.8s | $0.07 | no / no |
| DigitalOcean, Venice, SiliconFlow, Mancer, OpenInference | delivered, slower or pricier | | | |
| Parasail, GMICloud | softened (dash cut-away / vague) | | | |
| Azure | **content filter** (HTTP 400) | | | |
| Alibaba, AtlasCloud | **cut replies mid-sentence** (finish_reason `error`) | | | |
| DeepInfra | **429 rate-limited** 5/12 | | | |

## DeepSeek on Novita: format problems to fix in the prompt
- 4 of 8 texts had *asterisk actions* (texts must have none).
- One voice note had narration before `[voice]`; one audio tag (`[sighs]`) inside a plain text.
- One in-person scene written in first person instead of third.
- L3 ("show me everything"): 0/3 wrote the act itself; she lists what she wants instead.
- `min_p` is ignored by Novita, Baidu and StreamLake.
