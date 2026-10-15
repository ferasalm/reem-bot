// Rebuild Step 1 (2026-10-15): splits the one-file worker.js into src/ modules, behaviour unchanged. Run once, kept as the record of
// how the split was made: node tools/split/split.mjs <old worker.js> (the source is git show bcbe21c:worker.js).
// It needs acorn and eslint-scope (not repo dependencies; found under /opt/node-tools in Claude's container).
//   - tools/split/manifest.json names each top-level declaration's module, and the CONFIG paths that belong to the persona.
//   - Every declaration keeps its text and leading comments, gets `export`, and moves in its original order.
//   - Imports are computed from the references; persona modules are imported through src/persona/index.js (one switch point),
//     except by src/config/index.js, which imports the persona's CONFIG part directly (it must stay a leaf: no import cycle).
//   - It fails on a write to an imported binding (ES imports are read-only) and on a load-time use of a binding from a module
//     in the same import cycle (a TDZ error at start-up).
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, relative, join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(process.env.NODE_TOOLS || "/opt/node-tools/node_modules/");
const acorn = require("acorn");
const escope = require("eslint-scope");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const manifest = JSON.parse(readFileSync(join(ROOT, "tools/split/manifest.json"), "utf8"));
let src = readFileSync(process.argv[2], "utf8");
for (const [from, to] of manifest.edits) {
  if (src.split(from).length !== 2) throw new Error(`edit not found exactly once: ${from}`);
  src = src.replace(from, to);
}
const ast = acorn.parse(src, { ecmaVersion: "latest", sourceType: "module", locations: true, ranges: true });
const scope = escope.analyze(ast, { ecmaVersion: 2022, sourceType: "module" }).globalScope.childScopes[0];

// --- declarations, with their leading comments (the gap since the previous statement)
const decls = [];
const HEADER_END = ast.body.findIndex((n) => n.type !== "ImportDeclaration");
let prev = ast.body[HEADER_END - 1].end;
const external = new Map(); // imported name -> asset module
for (const n of ast.body.slice(0, HEADER_END)) for (const s of n.specifiers) external.set(s.local.name, manifest.assets[n.source.value]);
for (const n of ast.body.slice(HEADER_END)) {
  const names = n.type === "VariableDeclaration" ? n.declarations.map((d) => d.id.name) : n.type === "ExportDefaultDeclaration" ? ["default"] : [n.id.name];
  const key = names.join(",");
  const module = manifest.modules[key];
  if (!module) throw new Error(`no module for ${key}`);
  decls.push({ n, names, key, module, lead: src.slice(prev, n.start).replace(/^\n+/, ""), refs: new Set(), eager: new Set() });
  prev = n.end;
}
const owner = new Map();
for (const d of decls) for (const nm of d.names) owner.set(nm, d);
const unused = Object.keys(manifest.modules).filter((k) => !decls.some((d) => d.key === k));
if (unused.length) throw new Error(`manifest names no declaration: ${unused.join(", ")}`);

// --- references (lazy inside functions, eager otherwise)
const fnRanges = [];
(function visit(node) {
  if (!node || typeof node.type !== "string") return;
  if (/Function/.test(node.type)) fnRanges.push([node.start, node.end]);
  for (const k in node) { const v = node[k]; if (Array.isArray(v)) v.forEach(visit); else if (v && typeof v.type === "string") visit(v); }
})(ast);
const lazy = (p) => fnRanges.some(([a, b]) => a <= p && p < b);
const declAt = (p) => decls.find((d) => d.n.start <= p && p < d.n.end);
const problems = [];
for (const v of scope.variables) {
  for (const r of v.references) {
    const d = declAt(r.identifier.start);
    if (!d || d.names.includes(v.name)) continue;
    const target = owner.get(v.name);
    const targetModule = target ? target.module : external.get(v.name);
    if (!targetModule) throw new Error(`unknown top-level ${v.name}`);
    if (targetModule === d.module) continue;
    d.refs.add(v.name);
    if (r.isWrite()) problems.push(`${d.key} (${d.module}) writes ${v.name} of ${targetModule}`);
    if (!lazy(r.identifier.start)) d.eager.add(v.name);
  }
}

// --- the CONFIG literal: engine part and persona part
const CONFIG_KEY = "CONFIG";
const configDecl = decls.find((d) => d.key === CONFIG_KEY);
const cfgObj = configDecl.n.declarations[0].init;
const personaPaths = new Set(manifest.personaConfig);
const cut = []; // [start, end] of persona properties in src
function propText(obj, i) {
  // from the end of the previous property's comma (or the brace) to the end of this property's comma
  const p = obj.properties[i];
  const before = i ? obj.properties[i - 1].end : obj.start + 1;
  let start = src.indexOf(",", before) + 1;
  if (!i || start > p.start) start = before;
  let end = p.end;
  const after = src.slice(end).match(/^\s*,/);
  if (after) end += after[0].length;
  return [start, end];
}
const personaTree = {};
function walkConfig(obj, path, tree) {
  obj.properties.forEach((p, i) => {
    const k = p.key.name ?? p.key.value;
    const at = path ? `${path}.${k}` : k;
    if (personaPaths.has(at)) {
      const [s, e] = propText(obj, i);
      cut.push([s, e]);
      tree[k] = src.slice(s, e).replace(/^\n/, "");
      personaPaths.delete(at);
    } else if (p.value.type === "ObjectExpression" && [...personaPaths].some((x) => x.startsWith(at + "."))) {
      tree[k] = {};
      walkConfig(p.value, at, tree[k]);
      if (!Object.keys(tree[k]).length) delete tree[k];
    }
  });
}
walkConfig(cfgObj, "", personaTree);
if (personaPaths.size) throw new Error(`persona CONFIG paths not found: ${[...personaPaths].join(", ")}`);
cut.sort((a, b) => b[0] - a[0]);
let engineText = src.slice(cfgObj.start, cfgObj.end);
for (const [s, e] of cut) engineText = engineText.slice(0, s - cfgObj.start) + engineText.slice(e - cfgObj.start);
engineText = engineText.replace(/\n{3,}/g, "\n\n");
function treeText(tree, depth) {
  const pad = "  ".repeat(depth + 1);
  return Object.entries(tree).map(([k, v]) => (typeof v === "string" ? v.replace(/\s+$/, "") : `${pad}${k}: {\n${treeText(v, depth + 1)}\n${pad}},`)).join("\n");
}
const personaText = `{\n${treeText(personaTree, 0)}\n}`;
// what each part references (SYSTEM_PROMPT...): the persona part is the only one that may
const cfgRefs = [...configDecl.refs];

// --- modules
const files = new Map(); // module -> {decls, imports: Map(module -> Set(names))}
const fileOf = (m) => { if (!files.has(m)) files.set(m, { decls: [], imports: new Map() }); return files.get(m); };
for (const d of decls) fileOf(d.module).decls.push(d);
const PERSONA_BARREL = "src/persona/index.js";
const viaBarrel = (from, to) => to.startsWith("src/persona/") && !from.startsWith("src/persona/") && from !== "src/config/index.js";
function addImport(fromModule, name) {
  const target = owner.get(name);
  let to = target ? target.module : external.get(name);
  if (viaBarrel(fromModule, to)) to = PERSONA_BARREL;
  const f = fileOf(fromModule);
  if (!f.imports.has(to)) f.imports.set(to, new Set());
  f.imports.get(to).add(name);
}
for (const d of decls) {
  if (d.key === CONFIG_KEY) continue; // config/index.js is written by hand below
  for (const nm of d.refs) addImport(d.module, nm);
}
// src/config/index.js: CONFIG = engine + persona (persona keys added to the engine's objects)
fileOf("src/config/engine.js").imports = new Map();
fileOf("src/persona/reem-en/config.js").imports = new Map();
for (const nm of cfgRefs) {
  const to = owner.get(nm).module;
  if (!to.startsWith("src/persona/")) throw new Error(`CONFIG references a non-persona name ${nm}`);
  const f = fileOf("src/persona/reem-en/config.js");
  if (!f.imports.has(to)) f.imports.set(to, new Set());
  f.imports.get(to).add(nm);
}

// --- load-time cycles: an eager reference must point to a module outside the referrer's import cycle
const graph = new Map();
for (const [m, f] of files) graph.set(m, new Set(f.imports.keys()));
graph.get("src/config/index.js").add("src/config/engine.js").add("src/persona/reem-en/config.js");
const personaModules = [...files.keys()].filter((m) => m.startsWith("src/persona/reem-en/"));
graph.set(PERSONA_BARREL, new Set(personaModules));
const reach = (a, b) => { const seen = new Set(); const st = [a]; while (st.length) { const x = st.pop(); if (x === b) return true; if (seen.has(x)) continue; seen.add(x); for (const y of graph.get(x) || []) st.push(y); } return false; };
for (const d of decls) {
  for (const nm of d.eager) {
    if (d.key === CONFIG_KEY) continue;
    let to = owner.get(nm) ? owner.get(nm).module : external.get(nm);
    if (viaBarrel(d.module, to)) to = PERSONA_BARREL;
    if (to.startsWith("assets/")) continue;
    if (reach(to, d.module)) problems.push(`${d.key} (${d.module}) uses ${nm} of ${to} at load time, and ${to} imports back to it`);
  }
}
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }

// --- write
const CONFIG_TEXT = `// Every setting: the engine's (src/config/engine.js) with the persona's (src/persona/reem-en/config.js) merged in. A persona key
// never replaces an engine value (merge() throws on a clash), so each setting has one home. CONFIG_OVERRIDES (applyOverrides) then
// changes values in place.
export const CONFIG = merge(ENGINE, PERSONA_CONFIG, "");

function merge(engine, persona, path) {
  for (const [k, v] of Object.entries(persona)) {
    const at = path ? \`\${path}.\${k}\` : k;
    if (!(k in engine)) engine[k] = v;
    else if (isPlainObject(engine[k]) && isPlainObject(v)) merge(engine[k], v, at);
    else throw new Error(\`CONFIG.\${at} is set by both the engine and the persona\`);
  }
  return engine;
}
`;
for (const [to, nm] of [["src/config/engine.js", "ENGINE"], ["src/persona/reem-en/config.js", "PERSONA_CONFIG"]]) {
  const f = fileOf("src/config/index.js");
  f.imports.set(to, new Set([nm]));
}
const rel = (from, to) => { let r = relative(dirname(join(ROOT, from)), join(ROOT, to)); if (!r.startsWith(".")) r = "./" + r; return r; };
function importLines(m, f) {
  return [...f.imports].sort(([a], [b]) => a.localeCompare(b)).map(([to, names]) => {
    const list = [...names].sort((a, b) => a.localeCompare(b));
    const one = `import { ${list.join(", ")} } from "${rel(m, to)}";`;
    if (one.length <= 130) return one;
    const lines = []; let line = "";
    for (const nm of list) { if ((line + nm).length > 120) { lines.push(line.trimEnd()); line = ""; } line += nm + ", "; }
    lines.push(line.replace(/, $/, ","));
    return `import {\n${lines.map((l) => "  " + l).join("\n")}\n} from "${rel(m, to)}";`;
  }).join("\n");
}
const exportText = (d) => {
  const t = src.slice(d.n.start, d.n.end);
  return d.key === "default" ? t : "export " + t;
};
const out = {};
for (const [m, f] of files) {
  const head = manifest.headers[m] ? `// ${manifest.headers[m]}\n` : "";
  let body;
  if (m === "src/config/engine.js") body = `${configDecl.lead}export const ENGINE = ${engineText};\n`;
  else if (m === "src/persona/reem-en/config.js") body = `// The persona's part of CONFIG: merged into the engine's by src/config/index.js (persona keys added to the engine objects).\nexport const PERSONA_CONFIG = ${personaText};\n`;
  else body = f.decls.filter((d) => d.key !== CONFIG_KEY).map((d) => d.lead + exportText(d)).concat(f.decls.some((d) => d.key === CONFIG_KEY) ? ["\n" + CONFIG_TEXT] : []).join("\n").replace(/\n*$/, "\n");
  const imports = importLines(m, f);
  out[m] = `${head}${imports ? imports + "\n\n" : ""}${body}`;
}
// the barrel of the active persona
out[PERSONA_BARREL] = `// ${manifest.headers[PERSONA_BARREL]}\n` + personaModules.filter((m) => m !== "src/persona/reem-en/config.js").sort().map((m) => `export * from "${rel(PERSONA_BARREL, m)}";`).join("\n") + "\n";
for (const [m, text] of Object.entries(out)) {
  const path = m === "default" ? join(ROOT, "worker.js") : join(ROOT, m);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}
console.log(`${Object.keys(out).length} files written; ${decls.length} declarations; ${cut.length} persona CONFIG paths`);
