#!/bin/bash
# Every Claude session starts with the sync report (tools/sync-check.mjs): is this branch built on the
# latest shared work, and is work sitting on another branch? Its output is shown to Claude.
set -uo pipefail
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0
node tools/sync-check.mjs || echo "SYNC CHECK could not run: run node tools/sync-check.mjs by hand before changing anything."
echo "Then tell the owner the next step and its recommended effort (HANDOFF.md, Next steps)."
exit 0
