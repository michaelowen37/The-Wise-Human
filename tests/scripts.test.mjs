// Every spoken lesson line must make sense with the picture beside it, and read like a
// person talking rather than a list of words. This checks all of them.
import * as L from '../src/logic.mjs';
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => { if (cond) { pass++; console.log('PASS -', name); } else { fail++; console.log('FAIL -', name, detail); } };
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'hundred'];
const nameOnly = (sentence) => /^[A-Za-z]$/.test(sentence) || NUMBER_WORDS.includes(sentence.toLowerCase()) || /^[A-Za-z]([, ]+[A-Za-z])+$/.test(sentence);

const fragments = []; const mismatches = [];
for (const mod of L.MODULES) {
  for (const line of mod.lesson.script || []) {
    // Natural speech: at least one real sentence of four or more words, unless the line only names letters or counts aloud.
    const sentences = line.say.split(/[.!?]+/).map((x) => x.trim()).filter(Boolean);
    if (!sentences.every(nameOnly) && Math.max(...sentences.map((x) => x.split(/\s+/).length)) < 4) fragments.push(`${mod.id}: ${line.say}`);
    // The picture matches the words.
    const said = line.say.toLowerCase();
    const show = line.show;
    if (!show) continue;
    // An instruction ("Read this word", "Find the one that matches") shows the thing to act on,
    // which must not be spoken in a reading lesson. Only lines that describe what is shown are matched word for word.
    if (/^(read|find|look|listen|touch|say|tap|sound|count|start|try|watch|now|what)\b/i.test(line.say.trim())) continue;
    if (show.kind === 'letters') {
      const words = show.text.split(' ').filter(Boolean);
      const spelled = words.every((w) => w.length > 1 && /^[a-z]+$/.test(w)) && words.join('').length >= 3 && new Set(words.map((w) => w.length)).size === 1 && words.length >= 2 && !words.some((w) => said.includes(w));
      // a word shown must be said; a single letter shown must be said as a letter; split syllables must appear joined
      const fine = words.every((w) => said.includes(w.toLowerCase()) || (w.length === 1 && new RegExp(`\\b${w.toLowerCase()}\\b`).test(said))) || said.replace(/[^a-z]/g, '').includes(words.join('').toLowerCase()) || spelled;
      if (!fine) mismatches.push(`${mod.id}: "${line.say}" shows "${show.text}"`);
      if (show.highlight && show.highlight !== 'first' && !words.every((w) => w.toLowerCase().includes(show.highlight.toLowerCase()))) mismatches.push(`${mod.id}: highlight "${show.highlight}" is not in every word of "${show.text}"`);
    }
    if (show.kind === 'trace') {
      const t = show.text; const def = L.TRACE_LETTERS[t];
      if (!def) mismatches.push(`${mod.id}: "${line.say}" shows an unknown trace ${t}`);
      else {
        const fine = def.line ? /down|across|wav|zig|round|circle|line/.test(said) : t.startsWith('shape-') ? said.includes(t.slice(6)) : def.dots ? (/dot|picture/.test(said) || said.includes(t)) : (new RegExp(`\\b${t.toLowerCase()}\\b`).test(said) || /number|letter|line|arrow/.test(said));
        if (!fine) mismatches.push(`${mod.id}: "${line.say}" shows ${t} drawing itself`);
      }
    }
    if (show.kind === 'shape' && !said.includes(show.name)) mismatches.push(`${mod.id}: "${line.say}" shows a ${show.name}`);
    if (show.kind === 'icon' && !said.includes(show.name)) mismatches.push(`${mod.id}: "${line.say}" shows a ${show.name}`);
    if (show.kind === 'solid' && !said.includes(show.name) && !said.includes({ sphere: 'ball', cube: 'block', cylinder: 'can', cone: 'cone' }[show.name])) mismatches.push(`${mod.id}: "${line.say}" shows a ${show.name}`);
    // Every sign-in animal the words name must be on screen too, so a line never mentions a creature the child cannot see.
    { const shownPics = (show.kind === 'pair' ? [show.a, show.b] : [show]).filter((h) => h && h.kind === 'pic').map((h) => h.name);
      if (shownPics.length) { const named = L.PICTURES.filter((n) => new RegExp(`\\b${n}s?\\b`).test(said)); const missing = named.filter((n) => !shownPics.includes(n)); if (missing.length) mismatches.push(`${mod.id}: "${line.say}" names ${missing.join(', ')} but shows ${shownPics.join(', ')}`); } }
    // A pair is two pictures side by side; each half must be named by the words, by its own kind.
    const halves = show.kind === 'pair' ? [show.a, show.b] : [show];
    for (const h of halves) {
      if (show.kind === 'pair' && !h.kind && !said.includes(h.shape)) mismatches.push(`${mod.id}: "${line.say}" shows a ${h.shape}`);
      if (h.kind === 'swatch' && !said.includes(h.colour)) mismatches.push(`${mod.id}: "${line.say}" shows ${h.colour}`);
      if (h.kind === 'item' && !said.includes(h.shape) && !said.includes(h.colour)) mismatches.push(`${mod.id}: "${line.say}" shows a ${h.colour} ${h.shape}`);
      if (h.kind === 'dots' && !(said.includes(NUMBER_WORDS[h.count]) || said.includes(String(h.count)) || /count|one, two|more|less|fewer|away|left|dots|tap|group/.test(said))) mismatches.push(`${mod.id}: "${line.say}" shows ${h.count} dots`);
      if (show.kind === 'pair' && h.kind === 'shape' && !said.includes(h.name)) mismatches.push(`${mod.id}: "${line.say}" shows a ${h.name}`);
    }
  }
}
// Questions too: in every read-aloud course, the picture beside a question must be named or
// pointed at by the words, so what a child sees and hears agree.
const THING = { sphere: 'ball', cube: 'block', cylinder: 'can', cone: 'cone' };
const deictic = /\b(this|it|these|those|the picture|the word|the group|the shape|the letter|the letters|the array|the line|the frame|the clock|the sentence|the story|here)\b/i;
const qbad = [];
for (const c of L.COURSES.filter((x) => x.readAloud)) for (const m of c.modules) for (const g of new Set(m.generators)) for (let seed = 1; seed <= 40; seed++) {
  const q = L.generateQuestion(g, seed); const v = q.visual; if (!v) continue;
  const text = `${q.story || ''} ${q.prompt}`.toLowerCase();
  let fine = deictic.test(text);
  if (!fine) {
    if (v.kind === 'letters') { const words = v.text.split(' ').filter((w) => w !== '?'); const singles = words.every((w) => w.length === 1); fine = singles ? words.some((w) => new RegExp(`\\b${w.toLowerCase()}\\b`).test(text)) : words.every((w) => text.includes(w.toLowerCase())); }
    else if (v.kind === 'shape' || v.kind === 'solid') fine = text.includes(v.name) || (v.kind === 'solid' && text.includes(THING[v.name]));
    else if (v.kind === 'swatch') fine = text.includes(v.colour);
    else if (v.kind === 'icon') fine = text.includes(v.name);
    else if (v.kind === 'dots') fine = text.includes(NUMBER_WORDS[v.count]) || text.includes(String(v.count)) || /how many|count/.test(text);
    else if (v.kind === 'tens') fine = text.includes(String(v.count * 10)) || /how many|count|tens/.test(text);
    else if (v.kind === 'tenframe') fine = /ten|frame|make 10|empty|spaces|left|more/.test(text) || text.includes(String(v.filled));
    else if (v.kind === 'pair') fine = [v.a, v.b].every((h) => (h.kind ? text.includes(h.colour || '') || text.includes(h.shape || h.name || '') || (h.kind === 'dots' && (text.includes(NUMBER_WORDS[h.count]) || /more|fewer|how many|count/.test(text))) : text.includes(h.shape)));
    else if (v.kind === 'item') fine = text.includes(v.shape) || text.includes(v.colour);
    else if (v.kind === 'pattern') fine = v.counting ? (/how many|count/.test(text) || text.includes(v.items[0])) : /pattern|next|missing|repeat/.test(text); // a counting row (pass HT) is counted like dots
    else if (v.kind === 'bars' || v.kind === 'bar') fine = /line|long|short|bar|same/.test(text) || (v.shaded !== undefined && text.includes(String(v.shaded)));
    else fine = true;
  }
  if (!fine && !qbad.some((x) => x.startsWith(g + ':'))) qbad.push(`${g}: "${q.story || ''} ${q.prompt}" shows ${JSON.stringify(v)}`);
}
// Lesson pictures in read-aloud courses (pass JP): a pre-reader meets the lesson one spoken line at a time, so every
// painting belongs to one line (its step) and shares a word with it, the way a story picture shares a word with its paragraph.
const stem = (w) => w.replace(/'s$/, '').replace(/s$/, '');
const wordsOf = (t) => new Set((String(t).toLowerCase().match(/[a-z']{4,}/g) || []).map(stem));
const artBad = [];
for (const c of L.COURSES.filter((x) => x.readAloud)) for (const m of c.modules) for (const pic of (m.lesson && m.lesson.pictures) || []) {
  const line = L.readAloudScript(m)[pic.step];
  if (!Number.isInteger(pic.step) || !line) { artBad.push(`${m.id} ${pic.serial}: no spoken line (step ${pic.step})`); continue; }
  const said = wordsOf(line.say); if (![...wordsOf(pic.alt)].some((w) => said.has(w))) artBad.push(`${m.id} ${pic.serial}: "${pic.alt}" shares no word with "${line.say}"`);
}
ok('every lesson picture in a read-aloud course belongs to a spoken line that names it', artBad.length === 0, '\n  ' + artBad.join('\n  '));
// Taught before asked, for pictures and letters (pass JR): a question that asks for a picture or a letter by name (Tap
// the moon, What letter does bee start with?) asks for something its lesson must have said. Held for every module at
// the full standard (docs/review-status.json); tools/untaught.mjs lists the rest for the passes still to come.
const reviewedIds = Object.keys(JSON.parse(readFileSync(new URL('../docs/review-status.json', import.meta.url), 'utf8')).reviewed).filter((k) => k.startsWith('module:')).map((k) => k.slice(7));
const namesBad = new Set();
for (const id of reviewedIds) { const m = L.getModule(id); if (!m) continue;
  const raw = [...m.lesson.paragraphs, m.lesson.keyIdea, (m.lesson.example || {}).caption || '', ...L.readAloudScript(m).map((s) => s.say)].join(' '); const low = raw.toLowerCase();
  for (const g of new Set(m.generators)) for (let seed = 1; seed <= 60; seed++) for (const w of L.askedNames(L.generateQuestion(g, seed))) {
    if (!(/^[A-Z]$/.test(w) ? new RegExp(`\\b${w}\\b`).test(raw) : new RegExp(`\\b${w}`).test(low))) namesBad.add(`${id}: ${w}`);
  } }
ok('every picture or letter a reviewed lesson\'s questions ask for by name is said in that lesson', namesBad.size === 0, [...namesBad].join(', '));
// Taught before asked, for tracing (pass JT): every line, shape or letter a reviewed lesson's questions ask a child to
// trace is traced in that lesson first (First strokes once asked for waves and zigzags it never drew). Connect the dots
// pictures are exempt: the skill there is the order of the numbers, which one picture teaches.
const traceBad = new Set();
for (const id of reviewedIds) { const m = L.getModule(id); if (!m || !m.needsTouch) continue;
  const shown = new Set((m.lesson.script || []).filter((s) => s.show && s.show.kind === 'trace').map((s) => s.show.text));
  for (const g of new Set(m.generators)) for (let seed = 1; seed <= 60; seed++) { const q = L.generateQuestion(g, seed);
    if (q.type === 'trace' && q.traceKind !== 'dots' && !(L.TRACE_LETTERS[q.answer] || {}).dots && !shown.has(q.answer)) traceBad.add(`${id}: ${q.answer}`); } }
ok('every line, shape or letter a reviewed lesson asks a child to trace is traced in that lesson first', traceBad.size === 0, [...traceBad].join(', '));
// Every tracing lesson shows the stroke drawing itself, never a static letter or a count of dots (Mikey, 2026-09-14).
const traced = L.MODULES.filter((m) => m.needsTouch && m.lesson.script);
ok('every touch lesson shows a stroke drawing itself', traced.length > 0 && traced.every((m) => m.lesson.script.some((line) => line.show && line.show.kind === 'trace')), traced.filter((m) => !m.lesson.script.some((line) => line.show && line.show.kind === 'trace')).map((m) => m.id).join(', '));
ok('every spoken lesson line reads like a person talking', fragments.length === 0, '\n  ' + fragments.slice(0, 12).join('\n  '));
ok('every young-learner question names or points at its picture', qbad.length === 0, '\n  ' + qbad.slice(0, 12).join('\n  '));
ok('every lesson picture matches the words spoken over it', mismatches.length === 0, '\n  ' + mismatches.slice(0, 12).join('\n  '));
console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;   // never process.exit(): it can drop the last lines of a piped stdout (2026-09-23)
