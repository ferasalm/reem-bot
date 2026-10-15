// The Worker's modules with their internal functions, for the tests in this folder: src/internals.js (every module's exports)
// plus the entry point's default export (fetch, queue, scheduled). One instance per process: state is shared within a test file.
export async function loadWorker() {
  const internals = await import("../../src/internals.js");
  const entry = await import("../../worker.js");
  return { ...internals, default: entry.default };
}
