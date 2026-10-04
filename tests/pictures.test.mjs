// Every picture a lesson, a way or a question asks for is a kind the app can draw: the kinds are read
// from the source of the picture component (its `visual.kind === '...'` branches and the DIAGRAMS map),
// and every visual in the curriculum must name one of them. Silent when all is well.
import { readFileSync } from 'node:fs';
import * as L from '../src/logic.mjs';
let pass = 0; let fail = 0;
const ok = (label, cond, detail = '') => { console.log((cond ? 'PASS' : 'FAIL') + ' - ' + label + (cond ? '' : '  ' + detail)); cond ? pass++ : fail++; };
const ui = readFileSync('src/ui.jsx', 'utf8');
const kinds = new Set([...ui.matchAll(/visual\.kind === '([a-z0-9]+)'/g)].map((m) => m[1]));
const diagrams = ui.match(/^const DIAGRAMS = \{([^\n]*)\};/m);
for (const m of (diagrams ? diagrams[1] : '').matchAll(/([a-z0-9]+): [A-Za-z]+Pic/g)) kinds.add(m[1]);
kinds.add('bar');   // the picture component's last line draws any visual with parts and shaded as a fraction bar
const bad = [];
const check = (visual, where) => {
  if (!visual || typeof visual !== 'object') return;
  if (visual.kind && !kinds.has(visual.kind)) bad.push(`${where}: ${visual.kind}`);
  if (visual.kind === 'pair') { check(visual.a, where); check(visual.b, where); }
};
for (const m of L.MODULES) {
  const ex = m.lesson && m.lesson.example; if (ex) { check(ex, `${m.id} example`); for (const w of [].concat(ex.another || [])) if (w && typeof w === 'object') check(w.visual, `${m.id} way`); }
  for (const line of (m.lesson && m.lesson.script) || []) check(line.show, `${m.id} script`);
}
for (const g of Object.keys(L.GENERATORS)) { const q = L.generateQuestion(g, 7); check(q.visual, `${g} visual`); check(q.explainVisual, `${g} explanation`); }
ok('every lesson, way, script and question picture is a kind the app can draw', bad.length === 0, bad.slice(0, 8).join('; '));
// A stack drawing holds at most eight levels; more would run off the card.
ok('no stack drawing has more than eight levels', L.MODULES.every((m) => { const vis = []; const walk = (v) => { if (v && typeof v === 'object') { if (v.kind === 'stack') vis.push(v); for (const k of Object.keys(v)) if (typeof v[k] === 'object') walk(v[k]); } }; walk(m.lesson); return vis.every((v) => (v.levels || []).length <= 8); }));
console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;   // never process.exit(): it can drop the last lines of a piped stdout (2026-09-23)

