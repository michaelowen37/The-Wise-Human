// The Wise Human. Copyright (c) 2026. Source-available; not for reuse. See LICENSE.md.
// The art ledger as a spreadsheet for Leonardo sessions (2026-09-23, Mikey): one row per serial in ledger order with
// the serial, where it goes, the scene, the prompt, the negative prompt and the status.
// Run: node tools/prompts-csv.mjs > docs/LEONARDO-PROMPTS.csv
import { readFileSync } from 'node:fs';
const ledger = readFileSync('docs/ART-REQUESTS.md', 'utf8');
const cell = (t) => '"' + String(t).replace(/"/g, '""') + '"';
console.log(['serial', 'where', 'scene', 'prompt', 'negative prompt', 'status'].map(cell).join(','));
for (const line of ledger.split('\n')) {
  const m = /^\| ((?:CS|[A-Z])\d+) \| (.*?) \| (.*?) \| (.*?) \| (.*?) \| (\w+) \|$/.exec(line);
  if (m) console.log(m.slice(1).map(cell).join(','));
}
