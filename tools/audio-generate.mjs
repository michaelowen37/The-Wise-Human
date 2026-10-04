// Makes the app's recorded audio with ElevenLabs (2026-10-04, pass JH). In plain terms: reads docs/AUDIO-LEDGER.csv and, for every
// clip whose file is not in audio/ yet, asks ElevenLabs' Eleven v4 model (model_id eleven_v4) to speak the clip's tagged words,
// then saves audio/<key>.mp3, the name the app already looks for. Each request also carries the plain words just before and after
// the clip (previous_text and next_text), which ElevenLabs uses to keep the delivery steady from one clip to the next. Finished
// clips are skipped, so the run can be stopped and started again at any time.
// Run: ELEVENLABS_API_KEY=... node tools/audio-generate.mjs --voice <id> [--voice-young <id>] [--model eleven_v4] [--only S95] [--limit 50] [--dry-run]
// The API key comes only from the environment and is never written to a file.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
const args = process.argv.slice(2); const opt = (name, fallback = null) => { const i = args.indexOf(`--${name}`); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : fallback; };
const voice = opt('voice'); const voiceYoung = opt('voice-young', voice); const model = opt('model', 'eleven_v4');
const only = opt('only'); const limit = Number(opt('limit', 0)) || Infinity; const dry = !!opt('dry-run', false);
const key = process.env.ELEVENLABS_API_KEY;
if (!voice || (!key && !dry)) { console.log('Usage: ELEVENLABS_API_KEY=... node tools/audio-generate.mjs --voice <id> [--voice-young <id>] [--only S95] [--limit 50] [--dry-run]'); process.exit(1); }
// A small reader for the ledger's CSV: quoted fields, doubled quotes inside them.
function parseCsv(text) {
  const rows = []; let row = []; let field = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (ch === '"') q = false; else field += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { row.push(field); field = ''; } else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; } else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows; return body.filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
const rows = parseCsv(readFileSync(new URL('../docs/AUDIO-LEDGER.csv', import.meta.url), 'utf8'));
// The plain words just before and after each clip in its own story or lesson, for previous_text and next_text.
const plain = (t) => String(t).replace(/\[[^\]]*\]\s*/g, '').replace(/\s+/g, ' ').trim();
rows.forEach((r, i) => { r.previous = i > 0 && rows[i - 1].group === r.group ? plain(rows[i - 1].text) : ''; r.next = i + 1 < rows.length && rows[i + 1].group === r.group ? plain(rows[i + 1].text) : ''; });
const outDir = new URL('../audio/', import.meta.url); if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
let made = 0; let skipped = 0;
for (const r of rows) {
  if (only && !(r.key === only || r.key.startsWith(`${only}-`) || r.source === only)) continue;
  const file = new URL(`${r.key}.mp3`, outDir);
  if (existsSync(file)) { skipped++; continue; }
  if (made >= limit) break;
  const body = { text: r.text, model_id: model, ...(r.previous ? { previous_text: r.previous } : {}), ...(r.next ? { next_text: r.next } : {}) };
  const v = r.voice === 'young' ? voiceYoung : voice;
  if (dry) { console.log(`${r.key} -> voice ${v}: ${r.text}`); made++; continue; }
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(v)}`, { method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' }, body: JSON.stringify(body) });
  if (!res.ok) { console.log(`Stopped at ${r.key}: ElevenLabs answered ${res.status} ${await res.text()}`); process.exitCode = 1; break; }
  writeFileSync(file, Buffer.from(await res.arrayBuffer())); made++;
  console.log(`saved audio/${r.key}.mp3`);
}
console.log(`${dry ? 'would make' : 'made'} ${made} clip${made === 1 ? '' : 's'}; ${skipped} already there.`);
