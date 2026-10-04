// Every picture the app expects from Mikey has a row in the art ledger, so no photo is ever forgotten:
// story serials (S), coloring page serials (L), and nothing in the ledger that the app does not use.
import { readFileSync } from 'node:fs';
import { STORIES, COURSE_STORIES, COLOR_PAGES } from '../src/stories.mjs';
import { MAP_SERIALS, MODULES } from '../src/logic.mjs';
let pass = 0; let fail = 0;
const ok = (label, cond, detail = '') => { console.log((cond ? 'PASS' : 'FAIL') + ' - ' + label + (cond ? '' : '  ' + detail)); cond ? pass++ : fail++; };
const ledger = readFileSync('docs/ART-REQUESTS.md', 'utf8');
const rows = new Set([...ledger.matchAll(/^\| ((?:CS|[SLDMP])\d+) \|/gm)].map((m) => m[1]));
const lessonSerials = MODULES.flatMap((m) => (m.lesson && m.lesson.pictures || []).map((p) => p.serial));   // lesson pictures (pass JO)
const storySerials = Object.values(STORIES).flatMap((s) => [s.art, ...(s.more || []).map((m) => m.serial)]);
const letterSerials = 'abcdefghijklmnopqrstuvwxyz'.split('').map((ch, i) => `L${i + 1}`);
const drawingSerials = [...Array.from({ length: 27 }, (_, i) => `D${i + 1}`), ...Object.values(COLOR_PAGES).map(([serial]) => serial)];   // lesson pages D28 on (2026-09-24)
const courseSerials = Object.values(COURSE_STORIES).flatMap((s) => [s.art, ...(s.more || []).map((m) => m.serial)]);   // doubled long stories carry five more (2026-09-24)
const missing = [...storySerials, ...letterSerials, ...drawingSerials, ...courseSerials, ...MAP_SERIALS, ...lessonSerials].filter((x) => !rows.has(x));
ok('every lesson picture has a ledger row and a serial of its own', lessonSerials.every((x) => rows.has(x)) && new Set(lessonSerials).size === lessonSerials.length && MODULES.every((m) => (m.lesson && m.lesson.pictures || []).every((p) => /^P\d+$/.test(p.serial) && p.alt && p.alt.length > 5)), lessonSerials.filter((x) => !rows.has(x)).join(','));
ok('every story picture has a ledger row', missing.filter((x) => x.startsWith('S')).length === 0, missing.filter((x) => x.startsWith('S')).join(','));
ok('every letter coloring page has a ledger row', missing.filter((x) => x.startsWith('L')).length === 0, missing.filter((x) => x.startsWith('L')).join(','));
ok('every drawing page has a ledger row', missing.filter((x) => x.startsWith('D')).length === 0, missing.filter((x) => x.startsWith('D')).join(','));
ok('every course story has a ledger row', missing.filter((x) => x.startsWith('CS')).length === 0, missing.filter((x) => x.startsWith('CS')).join(','));
ok('every map has a ledger row', missing.filter((x) => x.startsWith('M')).length === 0, missing.filter((x) => x.startsWith('M')).join(','));
const used = new Set([...storySerials, ...letterSerials, ...drawingSerials, ...courseSerials, ...MAP_SERIALS, ...lessonSerials]);
const orphans = [...rows].filter((x) => !used.has(x));
ok('the ledger has no rows the app does not use', orphans.length === 0, orphans.join(','));
console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;   // never process.exit(): it can drop the last lines of a piped stdout (2026-09-23)
