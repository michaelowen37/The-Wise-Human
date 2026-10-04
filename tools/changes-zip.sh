#!/bin/sh
# Builds the two delivery zips and the prototype file for a pass:
#   edusphere-project.zip   the whole repository (no dist/, no browser-test output)
#   edusphere-changes.zip   only the files that differ from the previous edusphere-project.zip, plus CHANGES.md
#   edusphere-prototype.jsx the built single React file, for checking a change on a phone
# Usage: tools/changes-zip.sh <previous-project.zip> <output-dir>
set -e
PREV="$1"; OUT="$2"; HERE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$HERE"
rm -rf /tmp/edu-prev && mkdir -p /tmp/edu-prev && (cd /tmp/edu-prev && unzip -q "$PREV")
rm -f "$OUT/edusphere-project.zip" "$OUT/edusphere-changes.zip"
zip -qr "$OUT/edusphere-project.zip" . -x "dist/*" "tests/e2e/out/*" "tests/e2e/page.html" "tests/e2e/page-licensed.html" "*.DS_Store"
CHANGED=""
for f in $(unzip -Z1 "$OUT/edusphere-project.zip"); do
  if [ -f "$f" ] && ! cmp -s "$f" "/tmp/edu-prev/$f"; then CHANGED="$CHANGED $f"; fi
done
# CHANGES.md: the decisions added since the previous zip, ready to paste as a commit message, then the file list.
{
  echo "# What changed"
  echo
  echo "Paste the lines below as the commit message. Unzip this file onto the repository folder; it overwrites only the files listed."
  echo
  if [ -f /tmp/edu-prev/docs/DECISIONS.md ]; then diff /tmp/edu-prev/docs/DECISIONS.md docs/DECISIONS.md | grep '^> - ' | sed 's/^> //'; fi
  echo
  echo "## Files"
  for f in $CHANGED; do echo "- $f"; done
} > /tmp/edu-CHANGES.md
cp /tmp/edu-CHANGES.md CHANGES.md
zip -q "$OUT/edusphere-changes.zip" $CHANGED CHANGES.md
rm -f CHANGES.md
# Screenshots of every module that is new since the previous zip, at phone width, under screenshots/.
NEWIDS=$(node -e "Promise.all([import('$HERE/src/logic.mjs'), import('/tmp/edu-prev/src/logic.mjs')]).then(([a, b]) => { const old = new Set(b.MODULES.map((m) => m.id)); console.log(a.MODULES.filter((m) => !old.has(m.id)).map((m) => m.id).join(' ')); })" 2>/dev/null || true)
if [ -n "$NEWIDS" ]; then
  rm -rf /tmp/edu-shots/screenshots && mkdir -p /tmp/edu-shots/screenshots
  node tests/e2e/make-page.mjs >/dev/null 2>&1 || true
  node tools/shots.mjs /tmp/edu-shots/screenshots $NEWIDS || echo "screenshots skipped"
  (cd /tmp/edu-shots && zip -qr "$OUT/edusphere-changes.zip" screenshots)
fi
# The browser test leaves a phone-width picture of the report and of Who needs help; they ride along too.
rm -rf /tmp/edu-pages/screenshots && mkdir -p /tmp/edu-pages/screenshots
for f in tests/e2e/out/report.png tests/e2e/out/class-view.png; do [ -f "$f" ] && cp "$f" /tmp/edu-pages/screenshots/; done
(cd /tmp/edu-pages && [ -n "$(ls screenshots)" ] && zip -qr "$OUT/edusphere-changes.zip" screenshots) || true
cp dist/edusphere-prototype.jsx "$OUT/edusphere-prototype.jsx"
echo "changed:$CHANGED"
