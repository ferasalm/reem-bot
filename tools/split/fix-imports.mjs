// Recomputes the imports of src/ modules after code moves between them: drops imported names a module no longer uses and imports
// the names it uses but doesn't define, from the module that exports them. node tools/split/fix-imports.mjs [files...] (default:
// every module under src/ and worker.js). Needs acorn and eslint-scope (/opt/node-tools in Claude's container, or NODE_TOOLS).
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, relative, join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(process.env.NODE_TOOLS || "/opt/node-tools/node_modules/");
const acorn = require("acorn");
const escope = require("eslint-scope");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const all = execSync("git ls-files -co --exclude-standard src worker.js", { cwd: ROOT, encoding: "utf8" }).trim().split("\n")
  .filter((f) => f.endsWith(".js") && f !== "src/internals.js" && f !== "src/persona/index.js");
const parse = (text) => acorn.parse(text, { ecmaVersion: "latest", sourceType: "module", ranges: true, locations: true });
// who exports what (persona modules through the persona barrel, except for src/config and the persona itself)
const exporter = new Map();
for (const f of all) {
  for (const n of parse(readFileSync(join(ROOT, f), "utf8")).body) {
    if (n.type !== "ExportNamedDeclaration" || !n.declaration) continue;
    const d = n.declaration;
    for (const nm of d.declarations ? d.declarations.map((x) => x.id.name) : [d.id.name]) exporter.set(nm, f);
  }
}
for (const [nm, f] of [["FACE_JPEG_BASE64", "assets/face.js"]]) if (!exporter.has(nm)) exporter.set(nm, f);
for (const a of ["assets/face.js", "assets/places.js", "assets/mp3.js", "src/studio/page.js"]) {
  const text = readFileSync(join(ROOT, a), "utf8");
  for (const m of text.matchAll(/^export (?:const|let|var|function|class) (\w+)/gm)) if (!exporter.has(m[1])) exporter.set(m[1], a);
}
const rel = (from, to) => { let r = relative(dirname(join(ROOT, from)), join(ROOT, to)); if (!r.startsWith(".")) r = "./" + r; return r; };
const via = (from, to) => (to.startsWith("src/persona/") && !from.startsWith("src/persona/") && from !== "src/config/index.js" ? "src/persona/index.js" : to);
const files = process.argv.length > 2 ? process.argv.slice(2) : all;
let changed = 0;
for (const f of files) {
  const text = readFileSync(join(ROOT, f), "utf8");
  const ast = parse(text);
  const scope = escope.analyze(ast, { ecmaVersion: 2022, sourceType: "module" }).globalScope.childScopes[0];
  const local = new Set(), used = new Set();
  for (const v of scope.variables) {
    const imported = v.defs.some((d) => d.type === "ImportBinding");
    if (!imported) local.add(v.name);
    else if (v.references.length) used.add(v.name);
  }
  for (const r of scope.through) used.add(r.identifier.name);
  const imports = ast.body.filter((n) => n.type === "ImportDeclaration");
  const before = new Map(); // a name this file already imports keeps its source when no module exports it (assets/mp3.js)
  for (const n of imports) for (const s of n.specifiers) before.set(s.local.name, join(dirname(f), n.source.value).replace(/^\.\//, ""));
  const want = new Map();
  for (const nm of used) {
    if (local.has(nm) || (!exporter.has(nm) && !before.has(nm))) continue;
    const to = via(f, exporter.get(nm) || before.get(nm));
    if (to === f) continue;
    if (!want.has(to)) want.set(to, new Set());
    want.get(to).add(nm);
  }
  const lines = [...want].sort(([a], [b]) => a.localeCompare(b)).map(([to, names]) => {
    const list = [...names].sort((a, b) => a.localeCompare(b));
    const one = `import { ${list.join(", ")} } from "${rel(f, to)}";`;
    if (one.length <= 130) return one;
    const out = []; let line = "";
    for (const nm of list) { if ((line + nm).length > 120) { out.push(line.trimEnd()); line = ""; } line += nm + ", "; }
    out.push(line.replace(/, $/, ","));
    return `import {\n${out.map((l) => "  " + l).join("\n")}\n} from "${rel(f, to)}";`;
  }).join("\n");
  let next;
  if (imports.length) next = text.slice(0, imports[0].start) + lines + text.slice(imports.at(-1).end);
  else if (!lines) next = text;
  else { const head = text.match(/^(\/\/[^\n]*\n)*/)[0]; next = head + lines + "\n\n" + text.slice(head.length); }
  if (next !== text) { writeFileSync(join(ROOT, f), next); changed++; console.log("imports fixed:", f); }
}
console.log(`${changed} file(s) changed`);
