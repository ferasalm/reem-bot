// Imports worker.js with its internal functions exported, for the tests in this folder.
import { readFileSync, writeFileSync, mkdtempSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const EXPORTS = "CONFIG, runwareRoute, runwareAffordable, filterSafe, safeLine, askModel, saidBefore, recallSave, recallFind, longAgo, forSpeech, sayArabizi, trimUnfinished, sceneOf, noticeTime, mayTextFirst, scheduleNow, herHour, herDay, inHours, typingTime, lineDropped, applyOverrides, stripAudioTags, saysMinor, photoLine, mayDraw, takeSelfie, pictureMode, picturesAllowed, selfieSubject, selfiePicture, composePicture, locationOf, isDark, PLACE_JPEG_BASE64, planShot, pickTier, pickShot, chatHeat, shotNamed, pickWeighted, tierShots, scenePicturePrompt, sceneWearing, overlap, loadLedger, aiAffordable, aiSpent, fromBase64, drawPicture, drawRunware, runwareLoras, health, speakingTime, voiceSettings, bodyOf, takeReaction, openRouterBody, mergeSettings, shapeReply, scrubModel, isOoc, inPerson, texting, isNarration, emotesToTags, dropCues, SYSTEM_PROMPT, think, respond, parseCommand, isQuickCommand, commandList, hisName, aboutHim, findPart, cutAfter, joinParts, makeEntry, cleanDraft, draftHtml, replyMode, asksForVoice, asksHerOver, asksToHear, sceneSpeech, fitHistory, fitMessages, formatNudge, looksNarrated, unnarrate, stageToTags, markScene, pcmToMp3, offeredTags, isSpicy, spicyPicture, autoDraft, lingerieArgs, lingerieWords, placePictures, customPicture, exampleKeys, copiesExample, sexAct, picWords, runwareBody, startPicture, sexCue, lookWrite, lookPicture, lookCommand, stylePicture, runwarePlan, pictureFlags, nakedLine, runwareBodyName, logPicture, logSent, ensureStudioSchema, STUDIO_SCHEMA, nsfwLevel, nsfwCommand, nsfwButton, levelFor, nudeWords, picCommand, namesClothes, outfitBand, pickDayOutfits, dayOutfits, dayInfo, runCommand, refBytes, studioToken, studioCheck, studioRoute, studioCompose, studioDraw, studioLog, studioCommand, studioPresets, studioOptions";

export async function loadWorker() {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const copy = join(mkdtempSync(join(tmpdir(), "reem-test-")), "worker.mjs");
  writeFileSync(copy, `${readFileSync(join(root, "worker.js"), "utf8")}\nexport { ${EXPORTS} };\n`);
  copyFileSync(join(root, "face.js"), join(dirname(copy), "face.js")); // worker.js imports it
  copyFileSync(join(root, "places.js"), join(dirname(copy), "places.js"));
  copyFileSync(join(root, "mp3.js"), join(dirname(copy), "mp3.js"));
  copyFileSync(join(root, "studio.js"), join(dirname(copy), "studio.js")); // worker.js imports it (Step 7)
  return import(pathToFileURL(copy).href);
}
