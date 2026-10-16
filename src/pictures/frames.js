// Frame templates of the picture core (Rebuild Step 2, 2026-10-16): data only. prompt.js (framePrompt) puts them together in a
// fixed sentence order. The owner's picture rules (2026-10-15) hold in every string here, and lint.js checks them in the unit tests:
// what the lens sees and nothing else, POV for him (never "man", "he" or "his"), lens or perspective (never "camera"), affirmative
// words only (never "not", "no", "never", "without"), no body descriptions (the reference pictures carry her face and body), and
// every act frame names POV's penis.

// 1. The lens and perspective of each view ({angle}: ANGLES, selfies and POV only)
export const LENS = {
  selfie: "A smartphone selfie through her front lens, held at arm's length{angle}.",
  mirror: "A mirror selfie: her reflection in a tall mirror, an iPhone in one of her hands at chest height, its lenses toward the mirror, her face beside it.",
  pov: "A first-person perspective from POV's eyes, a few steps in front of her{angle}.",
  closeup: "A close first-person perspective from POV's eyes.",
  alone: "A first-person perspective from POV's eyes.",
};
// a selfie's or POV's angle (the old ANGLES said "camera"); weights stay PICTURE.ANGLE_WEIGHTS
export const ANGLES = {
  high: ", slightly above her eyes, tilted down",
  eye: ", at her eye level",
  low: ", slightly below her chin, tilted up",
  over: ", from just behind her shoulder as she glances back into the lens",
};
// seen from behind: after the lens sentence
export const BACK = "She is seen from behind, her back toward the lens.";
// 1b. How much of her the frame holds (spec.framing); "detail" says it in the pose
export const FRAMINGS = {
  face: "Framed close on her face and shoulders; the frame ends at her collarbones.",
  "chest-up": "Framed from her chest up; the frame ends at mid-chest.",
  "waist-up": "Framed from her waist up; the frame ends at her waist.",
  "three-quarter": "Framed from her head to mid-thigh; the frame ends at her thighs.",
  full: "Framed head to toe, her feet at the bottom of the frame.",
  crotch: "Her vulva fills the center of the frame, her inner thighs at the left and right edges, her lower belly at the top edge.",
  detail: "",
};
// 2. Who she is, by image number only ({face}, {body}: image numbers); the age statement stays (not a body description)
export const IDENTITY = {
  face: "She is the woman of image {face}",
  body: ", with the body of image {body}",
  bodyClothed: ", with the body shape of image {body}",
  bodyOnly: "Her body is the body of image {body}",
  age: ": an adult woman, 29.",
  hair: "Her hair: {hair}.",
  hairPicture: "Her hair is styled as in image {n}.",
};
// 3. What she wears ({outfit}: garment words; {n}: the outfit picture's image number)
export const WEAR = {
  clothed: "She is fully dressed in {outfit}.",
  outfitPicture: "She wears the outfit of image {n}.",
  nude: "She is fully nude.",
  top: "She wears only {outfit}; from the waist down she is nude.",
  bottom: "She wears only {outfit}; from the waist up she is nude.",
  partial: "She wears only {outfit}, the rest of her bare.",
};
// 4. Who is in the frame (views where POV looks at her)
export const ONLY_HER = "She is the only person in the frame.";
export const ONE_WOMAN = "She is the only woman in the frame."; // a 16:9 picture (it drew her twice, round 6)
// 5. Crop edges by view ({side}: left or right, picked once per spec)
export const EDGES = {
  selfie: "Her extended forearm is cropped at the {side} edge of the frame.",
};
// 6. The place and the light ({n}: the place picture's image number; {name}: LOCATIONS NAME; {light}: a LIGHT pick or her words')
export const PLACE = {
  picture: "Behind her is the room of image {n}.",
  words: "She is in {name}.",
  light: "Lit by {light}.",
  // at night the room's own lamps, and her face lit (2026-10-15: in the dark her face lost its likeness); the eye colour of the old
  // SCENE_NIGHT is a face word, out by the owner's rule (WORKPLAN Rebuild, risk 15: the bench checks her eyes in the dark)
  night: "It is night: the windows are dark, and warm lamp light from the room falls on her face.",
  nightAlone: "It is night, lit only by the lights in the scene.",
};
// 7. Her expression
export const EXPRESSION = "Her expression: {expression}.";
// 8. One affirmative photo-style line
export const PHOTO = "An unretouched iPhone photo: natural skin texture with pores and fine hair, real light from one side with soft falloff, true color, fine grain in dim light.";
// /look without her: the lens, the scene, the light, the photo line
export const ALONE_PHOTO = "An unretouched iPhone photo, true color, fine grain in dim light.";

// Penetration words by hole ({hole} slot of the act frames)
export const PENETRATION = {
  vagina: "POV's erect penis inside her vagina, the shaft entering her vulva at its center, her labia spread around it",
  vaginaBehind: "POV's erect penis inside her vagina from behind, the shaft entering her vulva between her thighs",
  anus: "POV's erect penis inside her anus between her spread buttocks, her vulva visible just below it",
};
// Act frames, first match wins (the narrower acts first). `words`: what names the act (his /pic words, her words, the writer's action,
// her narration's SEX_CUES name); `hole`: mouth, hand or vagina (anal acts take PENETRATION.anus and their `anal` text); `back`: seen
// from behind (the nude back body picture); `oral`: ASPECTS.ORAL. Each frame names what is visible, POV's parts included, and POV's
// penis by name (owner 2026-10-15: below weight 1 the LoRA alone doesn't draw it).
export const ACTS = {
  deepthroat: {
    words: "deepthroat, deep throat, deepthroating, down her throat",
    hole: "mouth", oral: true,
    text: "A first-person perspective looking down at her: she kneels in front of POV, POV's erect penis deep in her mouth, her lips at its base, tears at the corners of her eyes, her eyes up toward the lens. POV's lower belly is at the bottom edge of the frame.",
  },
  blowjob: {
    words: "a blowjob, blowjob, blow job, sucking, sucks, suck, oral, in her mouth, takes POV in her mouth",
    hole: "mouth", oral: true,
    text: "A first-person perspective looking down at her: she kneels in front of POV, POV's erect penis in her mouth, her lips around the shaft, her eyes up toward the lens. POV's lower belly is at the bottom edge of the frame.",
  },
  handjob: {
    words: "handjob, hand job, jerking, stroking",
    hole: "hand",
    text: "A first-person perspective looking down at her: she kneels in front of POV, one of her hands around POV's erect penis, her eyes up toward the lens. POV's lower belly is at the bottom edge of the frame.",
  },
  // her own hand (no POV penis: a solo act)
  masturbating: {
    words: "fucking herself, fingering herself, fingers herself, touching herself, masturbates, masturbating, playing with herself",
    hole: "hand", solo: true,
    text: "A first-person perspective looking down at her: she lies back with her legs spread, one of her hands between her thighs, two fingers inside her vulva.",
  },
  "reverse cowgirl": {
    words: "reverse cowgirl, facing away",
    hole: "vagina", back: true,
    text: "A first-person perspective from below and behind her: she sits astride POV's hips facing away, her back and bottom toward the lens, {hole}; she glances back over her shoulder. POV's lower belly and thighs fill the bottom edge of the frame.",
  },
  riding: {
    words: "riding the man, cowgirl, riding, rides, ride, sinks down onto, lowers herself onto, on top of POV, she is on top, straddles, straddling",
    hole: "vagina",
    text: "A first-person perspective looking up at her from below: she sits astride POV's hips, upright and facing the lens, {hole}. POV's lower belly and hips fill the bottom edge of the frame.",
    // anal riding is drawn from behind (the old ANAL_POSITION_WORDS: riding = reverse cowgirl)
    analAs: "reverse cowgirl",
  },
  prone: {
    words: "prone bone, prone, lying flat, on her stomach",
    hole: "vagina", back: true,
    text: "A first-person perspective from above and behind her: she lies flat on her stomach on the bed, legs together, her bottom toward the lens, {hole}; she looks back over her shoulder, her cheek on the pillow. POV's lower belly fills the bottom edge of the frame.",
  },
  "doggy style": {
    words: "doggy style, doggystyle, doggy, on all fours, all fours, hands and knees, from behind, bent over",
    hole: "vagina", back: true,
    text: "A first-person perspective from behind and above her: she is on all fours on the bed, her back and bottom toward the lens, {hole}; she looks back over her shoulder. POV's lower belly fills the bottom edge of the frame.",
  },
  missionary: {
    words: "missionary, on her back, legs up, knees to her chest, on top of her",
    hole: "vagina",
    text: "A first-person perspective looking down at her: she lies on her back on the bed, her legs spread around POV's hips, {hole}; she looks up into the lens. POV's lower belly and thighs fill the bottom edge of the frame.",
    anal: "A first-person perspective looking down at her: she lies on her back on the bed, her knees pulled up to her chest and her legs held wide, {hole}; she looks up into the lens. POV's lower belly and thighs fill the bottom edge of the frame.",
  },
};
// an act the words name with no position: POV's penis in the frame, her pose from the words
export const ACT_GENERIC = "A first-person perspective looking down at her: she lies on the bed, POV's erect penis in the frame. POV's lower belly and thighs fill the bottom edge of the frame.";
// the anal positions by name (ANAL_POSITIONS weights pick one when the words name none)
export const ANAL_ACTS = ["doggy style", "prone", "reverse cowgirl", "missionary"];

// Her selfie shots (PICTURE.SHOTS keys) as frames: view, framing and the pose; `poses`: [pose, place key] (one picked); `places`: the
// place keys a mirror can be in. A shot not listed is a chest-up selfie.
export const SHOTS = {
  close: { view: "selfie", framing: "face", angle: true },
  selfie: { view: "selfie", framing: "chest-up", angle: true },
  mirror: { view: "mirror", framing: "full", places: ["bedroom", "hallway"], pose: "a little flash glare on the glass" },
  cozy: { view: "selfie", framing: "chest-up", angle: true, poses: [["curled up on the sofa, wool socks, knees pulled up", "living"], ["under a blanket on the sofa", "living"], ["in bed against the pillows", "bedroom"]] },
  detail: { view: "closeup", framing: "detail", poses: [["her hand with thin gold rings around a coffee cup fills the frame, the frame ending at her wrist", "kitchen"], ["her bare feet up on the railing fill the frame, the frame ending at her ankles", "porch"], ["her hand with a yellow highlighter on a stack of receipts by a printing calculator fills the frame, the frame ending at her wrist", "living"]] },
  golden: { view: "selfie", framing: "chest-up", angle: true, poses: [["at golden hour, warm low sun on her face, maple trees and rooftops behind her", "porch"]], light: "" },
  "mirror-back": { view: "mirror", framing: "three-quarter", back: true, places: ["bedroom", "hallway"], pose: "she stands with her back to the mirror and twists to look over her shoulder at her phone; the reflection shows her back" },
  neckline: { view: "selfie", framing: "chest-up", pose: "seen from high above her, her collarbones and neckline in the frame" },
  legs: { view: "selfie", framing: "three-quarter", poses: [["sitting on the sofa, her legs crossed and in the frame, seen from above", "living"], ["sitting on the bed, her legs crossed and in the frame, seen from above", "bedroom"], ["sitting on a chair, her legs crossed and in the frame, seen from above", "porch"]] },
  waist: { view: "mirror", framing: "three-quarter", places: ["bedroom"], pose: "one of her hands on her waist, her hip turned toward the mirror" },
  "belly-down": { view: "selfie", framing: "waist-up", poses: [["lying on her stomach on the bed, propped on her elbows, her feet up and crossed behind her, seen from above", "bedroom"], ["lying on her stomach on the sofa, propped on her elbows, her feet up and crossed behind her, seen from above", "living"]] },
  overhead: { view: "selfie", framing: "waist-up", poses: [["lying on her back in bed, her hair spread over the pillow, seen from straight above", "bedroom"]] },
  "floor-sit": { view: "selfie", framing: "three-quarter", angle: true, poses: [["sitting on the floor with her back against the sofa, knees pulled up, a mug beside her", "living"]] },
  "counter-sit": { view: "selfie", framing: "three-quarter", angle: true, poses: [["sitting up on the counter, legs dangling, leaning back on one of her hands", "kitchen"]] },
  "window-lean": { view: "selfie", framing: "waist-up", angle: true, poses: [["leaning on the window frame, half turned toward the glass", "bedroom"], ["leaning on the window frame, half turned toward the glass", "living"]] },
  "stretch-mirror": { view: "mirror", framing: "full", places: ["bedroom", "hallway"], pose: "stretching one arm up over her head, her top riding up a little" },
  "kneel-mirror": { view: "mirror", framing: "full", places: ["bedroom"], pose: "she kneels on the bed, sitting back on her heels, back arched a little" },
};
// Photo-type words in /pic words (longest first): the shot they ask for. Only these pick a shot (ordinary words like "couch", "legs" or
// "chest" in the old SHOT_WORDS stay in the pose); "full body" and "head to toe" only set the framing
export const PHOTO_TYPES = { "mirror selfie": "mirror", "in the mirror": "mirror", belfie: "mirror-back", mirror: "mirror", selfie: "selfie" };
// framing words in /pic words (POV keeps its view: "close-up from above" is a close POV picture, not a selfie)
export const FRAMING_WORDS = { "close-up": "face", "close up": "face", "full body": "full", "full-body": "full", "head to toe": "full", "waist up": "waist-up", "chest up": "chest-up" };
// words that name the photo, its framing or its tier, taken out of the pose (framePrompt says them)
export const TYPE_WORDS = [...Object.keys(PHOTO_TYPES), ...Object.keys(FRAMING_WORDS), "photo", "picture", "pic", "shot", "everyday", "flirty", "boudoir", "nude tier"];
// The framing each view gets when nothing names one
export const DEFAULT_FRAMING = { selfie: "chest-up", mirror: "full", pov: "three-quarter", "pov-act": "", closeup: "crotch", alone: "" };
