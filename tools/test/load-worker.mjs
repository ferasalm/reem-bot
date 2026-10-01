// Imports worker.js with its internal functions exported, for the tests in this folder.
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const EXPORTS = "CONFIG, forSpeech, sayArabizi, trimUnfinished, sceneOf, noticeTime, mayTextFirst, scheduleNow, herHour, herDay, inHours, typingTime, lineDropped, applyOverrides, stripAudioTags, speakingTime, voiceSettings, bodyOf";

export async function loadWorker() {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const copy = join(mkdtempSync(join(tmpdir(), "reem-test-")), "worker.mjs");
  writeFileSync(copy, `${readFileSync(join(root, "worker.js"), "utf8")}\nexport { ${EXPORTS} };\n`);
  return import(pathToFileURL(copy).href);
}
