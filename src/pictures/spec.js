// ShotSpec (Rebuild Step 2, 2026-10-16): what one picture is, as data. interpret.js builds it from her words, the writer, /pic or /look;
// prompt.js (framePrompt) phrases it; drawPicture logs it as JSON in D1 (`spec`). Every random pick (expression, hair, aspect, place
// crop, angle, the anal position, the crop side) is made once, here in the spec: an anatomy redraw keeps the same spec, only the seed
// changes.
//   view: selfie | mirror | pov | pov-act | closeup | alone
//   content: clothed | partial | nude | act
//   act: { name, hole, position } (name: a frames.ACTS key or "act"; hole: mouth | hand | vagina | anus)
//   back: seen from behind; profile: "" | left | right, seen from the side (PROFILE_WORDS; the side-view body picture facing that way)
//   outfit: { key, refId, words, kept } (words: the clothes; kept: "top" | "bottom" | "" when partly dressed; refId: an outfit picture,
//     Step 4) ; garmentState: "on" | "off" (pulled aside waits on its own LoRA, owner 2026-10-15)
//   hair: { key, refId } (key: a HAIRSTYLES text or "" when the words name her hair)
//   place: { key, crop, night } (key: a LOCATIONS key; crop: the places.js picture name, "" = words only)
//   light ("" at night or when the words name it), dark (the night sentence), expression, pose (what she is doing, free words that passed ruleWords), framing, aspect ("9:16" | "1:1" | "16:9")
//   angle: an ANGLES key; side: left | right (selfie crop edge)
//   inFrame: { her: [...], pov: [...] } and edges: [{ part, edge }] (what the frame holds; the act frames and EDGES say it in words)
//   alone: /look without her: the scene words
export const VIEWS = ["selfie", "mirror", "pov", "pov-act", "closeup", "alone"];
export const CONTENTS = ["clothed", "partial", "nude", "act"];
export const FRAMING_NAMES = ["face", "chest-up", "waist-up", "three-quarter", "full", "crotch", "detail", ""];

export function newSpec(fields = {}) {
  return {
    v: 1,
    source: "",
    herself: true,
    view: "pov",
    content: "clothed",
    act: null,
    back: false,
    profile: "",
    outfit: { key: "", refId: "", words: "", kept: "" },
    garmentState: "on",
    hair: { key: "", refId: "" },
    place: { key: "", crop: "", night: false },
    light: "",
    dark: false,
    expression: "",
    pose: "",
    framing: "",
    aspect: "9:16",
    angle: "",
    side: "",
    inFrame: { her: [], pov: [] },
    edges: [],
    alone: "",
    ...fields,
  };
}
// The content key of the LoRA weight table (PICTURE.FRAMES.LORA_WEIGHTS): a partly dressed act is "act-partial", /look alone "alone"
export const loraKey = (spec) => (!spec.herself ? "alone" : spec.content === "act" ? (spec.outfit.words ? "act-partial" : "act") : spec.content);
// What D1 keeps of a spec (no bytes; short)
export const specJson = (spec) => JSON.stringify(spec);
