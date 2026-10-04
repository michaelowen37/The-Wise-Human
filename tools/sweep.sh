#!/bin/sh
# EduSphere. Copyright (c) 2026. Source-available; not for reuse. See LICENSE.md.
# The pre-commit sweep: every module's lesson, story and first question, then every game and educator page,
# at phone width and at laptop width, in a real browser. About four minutes per width. Run after ./check.sh.
set -e
cd "$(dirname "$0")/.."
export PLAYWRIGHT_PATH="${PLAYWRIGHT_PATH:-$HOME/.npm-global/lib/node_modules/playwright}"
node tests/e2e/make-page.mjs >/dev/null
for w in 360 1280; do
  echo "== modules at ${w}px"
  for lv in "early years" "elementary" "middle school" "high school and beyond"; do SWEEP_WIDTH=$w node tools/sweeps/modules.mjs "$lv" | tail -4; done
  echo "== pages at ${w}px"
  SWEEP_WIDTH=$w node tools/sweeps/pages.mjs | tail -3
done
echo "SWEEP DONE - read the lines above; any overflow, failed or errors count above 0 means stop"
