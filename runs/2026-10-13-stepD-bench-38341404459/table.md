# Step D bench, 2026-10-13 (Opus 5.5, `claude-opus-5-5`; `tools/face/stepd-bench.mjs`, runs 38341404459 and 38341749003 (the latter in runs/2026-10-13-stepD-bench-38341749003))

The bot's own startPicture: writer (Llama 3.3 70B fast) → draw (Off: Cloudflare klein 4B with her face and body; On: Runware) → anatomy
check (Llama 4 Scout) → redraws. Every try read at full size. Run 1 counted "2 heads" on acts (fixed before run 2).

| Picture | Check | Read |
|---|---|---|
| r1 off-counter r1 | ok | cardigan over cami, **bare thighs** (writer: "and no visible bottom garment"); anatomy fine |
| r1 off-counter r2 | ok | sweatpants; clean |
| r1 off-mirror r1, r2 | ok | slip dress, iPhone in the mirror; clean |
| r1 off-couch r1 | ok | hoodie, leggings; **a phone held up** in a front-camera selfie; anatomy fine |
| r1 off-couch r2 t1 | "2 heads" | no second head (her sleeve and the sofa arm at the edge): false alarm |
| r1 off-couch r2 t2 (sent) | ok | clean |
| r1 off-doorframe r1 | ok | clean |
| r1 off-doorframe r2 | ok | **her leg in sweatpants runs into a gray sleeved arm at the bottom right** (missed) |
| r1 off-kitchen r1, r2 | ok | black tank, floury sweatpants, stirring; clean |
| r1 on-riding t1 (sent), t2, t3 | "2 heads" x3 | act right; his hand at the left edge; a small shape at her hip (unclear) |
| r2 off-counter r1 | ok | on the counter, sweatpants; clean |
| r2 off-counter r2 | ok | **a stray gray sleeve at the right edge** (missed) |
| r2 off-mirror r1, r2 | ok | clean |
| r2 off-couch r1 | ok | standing, framed as a third-person photo (not a selfie); anatomy fine |
| r2 off-couch r2 | ok | a selfie; clean |
| r2 off-doorframe r1, r2 | ok | clean |
| r2 off-kitchen r1, r2 | ok | clean |
| r2 on-riding | ok | act right; a hint of extra fingers under her right hand |

Off (klein 4B with her references): anatomy clean 18/20; the 2 slips (an edge sleeve, a leg into an arm) missed by the check; 1 false alarm.
Seconds a picture: 11-37 at Off, 19-43 at On.
