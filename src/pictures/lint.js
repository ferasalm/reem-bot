// The picture prompt lint (Rebuild Step 2, 2026-10-16): the owner's picture rules (2026-10-15) as checks. A unit test runs it over
// every frame and golden plan; at runtime drawPicture logs its findings in D1 (`lint`) and never blocks a picture.

// him (POV is his word in the frames), the camera, negatives
const BANNED = /\b(?:man|men|man's|he|him|his|himself|camera|cameras|not|no|never|without|nobody|none|isn't|aren't|don't|doesn't|can't|won't|never)\b/gi;
// a build adjective on a body part (body-part nouns alone stay: the frames place things with them)
const BUILD = "full|fuller|thick|thicker|wide|wider|big|bigger|large|small|narrow|tapered|round|rounded|curvy|curvier|slim|slimmer|slender|petite|plump|ample|toned|defined|bubbly|heavy|chubby|skinny|soft|perky|voluptuous";
const PARTS = "bust|breasts?|chest|hips?|thighs?|arms?|waist|waistline|bottom|butt|ass|buttocks|belly|stomach|shoulders|legs|body|figure|build|frame";
const BODY = new RegExp(`\\b(?:${BUILD})(?:[\\s,-]+(?:and\\s+)?[\\w-]+){0,2}?[\\s-]+(?:${PARTS})\\b`, "gi");
const WORDS = /\b(?:curves|curvy|voluptuous|hourglass)\b/gi;
const EYES = /\b(?:green|hazel|hazel-green|brown|blue|amber|gray|grey|dark)[\s-]+eyes\b/gi;
const SKIN = /\b(?:olive|ivory|fair|pale|tan|tanned|dark|light|porcelain|wheatish)[\s-]+skin(?:ned)?\b/gi;

// Every finding in `text` as short strings ("banned: camera", "body: big round bubbly bottom", "image 4 of 3"): [] = clean.
// `refs`: how many reference pictures go with the prompt (every "image N" must be lower).
export function lintPrompt(text, refs = Infinity) {
  const t = String(text || "");
  const out = [];
  const add = (kind, re) => {
    for (const m of t.matchAll(re)) out.push(`${kind}: ${m[0].toLowerCase()}`);
  };
  add("banned", BANNED);
  add("body", BODY);
  add("body", WORDS);
  add("eyes", EYES);
  add("skin", SKIN);
  for (const m of t.matchAll(/\bimages?\s+(\d+)\b/gi)) if (Number(m[1]) >= refs) out.push(`image ${m[1]} of ${refs === Infinity ? "?" : refs}`);
  return [...new Set(out)];
}
// A free-text field (her words, the writer's action, /look's text) made to follow the rules where it can: him → POV, camera → lens,
// a negated phrase dropped ("with no bangs", "never his face"). What it can't fix is left for the lint to report.
export function ruleWords(text) {
  return String(text || "")
    .replace(/\bthe camera\b/gi, "the lens").replace(/\bcameras?\b/gi, "lens")
    .replace(/\b(?:the man|he|him)['’]s\b/gi, "POV's").replace(/\bhis\b/gi, "POV's").replace(/\bthe man\b/gi, "POV").replace(/\b(?:him|himself)\b/gi, "POV").replace(/\bhe\b/gi, "POV")
    // "with no bangs", "and no makeup", "never her face": the negative and up to three words after it, stopping at "and"/"or"
    .replace(/(?:,\s*|\s+)(?:with\s+|and\s+)?(?:no|not|never|without)\s+(?:(?!and\b|or\b)[\w'’-]+[ ]?){1,3}/gi, " ")
    .replace(/^(?:no|not|never|without)\s+(?:(?!and\b|or\b)[\w'’-]+[ ]?){1,3}[,;]?\s*/i, "")
    .replace(/\s+([,.;:])/g, "$1").replace(/([,;])\s*(?=[,.;])/g, "").replace(/\s{2,}/g, " ").trim();
}
