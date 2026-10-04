// Every word a student or educator reads uses standard American spelling, and a few
// house style rules hold everywhere. This scans the prose inside src/logic.mjs and
// src/ui.jsx: string literals that contain a space (identifiers and keys have none).
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => { if (cond) { pass++; console.log('PASS -', name); } else { fail++; console.log('FAIL -', name, detail); } };

// British spellings and the American form, as whole-word patterns.
const BRITISH = [
  [/\bcolou?r(s|ed|ing|ful|less)?\b/gi, 'color', /\bcolour/i], [/\bfavourite(s)?\b/gi, 'favorite', /favourite/i],
  [/\bcentre(s|d)?\b/gi, 'center', /centre/i], [/\b(recogni|organi|apologi|reali|memori|emphasi|categori)s(e|es|ed|ing)\b/g, '-ize', /(recogni|organi|apologi|reali|memori|emphasi|categori)s(e|es|ed|ing)\b/],
  [/\bneighbour(s|hood|ing)?\b/gi, 'neighbor', /neighbour/i], [/\bhonour(s|ed|able)?\b/gi, 'honor', /honour/i], [/\bbehaviour(s|al)?\b/gi, 'behavior', /behaviour/i],
  [/\bhumour\b/gi, 'humor', /humour/i], [/\blabour\b/gi, 'labor', /labour/i], [/\bflavour(s)?\b/gi, 'flavor', /flavour/i],
  [/\bgrey\b/gi, 'gray', /\bgrey\b/i], [/\bprogramme(s)?\b/gi, 'program', /programme/i], [/\bmaths\b/gi, 'math', /\bmaths\b/i],
  [/\blearnt\b/gi, 'learned', /\blearnt\b/i], [/\bspelt\b/gi, 'spelled', /\bspelt\b/i], [/\bwhilst\b/gi, 'while', /\bwhilst\b/i],
  [/\btravell(ing|ed|er)\b/gi, 'traveling', /travell/i], [/\bcancelled\b/gi, 'canceled', /cancelled/i], [/\bpractis(e|es|ed|ing)\b/gi, 'practice', /practis/i],
  [/\banalys(e|es|ed|ing)\b/gi, 'analyze', /analys(e|es|ed|ing)\b/i], [/\bdefence\b/gi, 'defense', /defence/i], [/\bcatalogue\b/gi, 'catalog', /catalogue/i],
  [/\bmould\b/gi, 'mold', /mould/i], [/\bplough\b/gi, 'plow', /plough/i], [/\btyre(s)?\b/gi, 'tire', /\btyre/i], [/\bpyjamas\b/gi, 'pajamas', /pyjamas/i],
  [/\bcheque\b/gi, 'check', /cheque/i], [/\bkerb\b/gi, 'curb', /\bkerb\b/i], [/\baluminium\b/gi, 'aluminum', /aluminium/i], [/\bmum\b/gi, 'mom', /\bmum\b/i],
  [/\bstorey\b/gi, 'story', /storey/i], [/\bjewellery\b/gi, 'jewelry', /jewellery/i], [/\brubbish\b/gi, 'trash', /rubbish/i], [/\bfootpath\b/gi, 'sidewalk', /footpath/i],
];

// Prose strings: single-quoted, double-quoted, or template literals, that contain a space.
function proseStrings(source) {
  const out = [];
  const re = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g;
  let m;
  while ((m = re.exec(source))) { const t = m[1] ?? m[2] ?? m[3]; if (t && (t.includes(' ') || (/^[A-Za-z]+$/.test(t) && t.length > 3))) out.push(t); }
  return out;
}

for (const file of ['src/logic.mjs', 'src/ui.jsx']) {
  const src = readFileSync(file, 'utf8');
  // Comments are for developers and may quote anything; strip them so only prose is checked.
  // Identifiers are code, not prose: strip id fields, module id lists and requires lists before scanning.
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1').replace(/\b(id|courseId|moduleId|toModuleId): '[^']*'/g, '').replace(/\b(requires|moduleIds|courseIds|generators): \[[^\]]*\]/g, '');
  const strings = proseStrings(code);
  for (const [pattern, american, detect] of BRITISH) {
    const hits = strings.filter((t) => detect.test(t.replace(/\$\{[^}]*\}/g, 'X'))).slice(0, 3);
    ok(`${file}: no British spelling where American is ${american}`, hits.length === 0, hits.map((h) => JSON.stringify(h.slice(0, 60))).join(' | '));
  }
  ok(`${file}: no em dashes in prose`, !strings.some((t) => t.includes('\u2014')), strings.filter((t) => t.includes('\u2014')).slice(0, 2).join(' | '));
  ok(`${file}: no double spaces in prose`, !strings.some((t) => /\S  \S/.test(t)), strings.filter((t) => /\S  \S/.test(t)).slice(0, 2).join(' | '));
  const plain = (t) => t.replace(/\$\{[^}]*\}/g, 'X');
  const isProse = (t) => !/@media|@keyframes|\{ *[a-z-]+ *:/.test(t) && !/\+ \?|= \?|\? =|÷ \?|× \?|as \?/.test(t) && t.trim() !== '?';
  const spaced = (t) => isProse(t) && (/ [,.;:!?]/.test(plain(t)));
  ok(`${file}: no space before punctuation`, !strings.some((t) => spaced(t) && !/\.\.\./.test(t)), strings.filter((t) => spaced(t) && !/\.\.\./.test(t)).slice(0, 2).map((t) => JSON.stringify(t.slice(0, 60))).join(' | '));
}
// Teaching text reads cleanly: a key idea is short sentences, never one long one, and every
// line of a lesson that is a sentence starts with a capital and ends with a mark. Centered
// [[ ]] lines, equations and connector words like "becomes" are not sentences and are skipped.
const L = await import('../src/logic.mjs');
const strip = (t) => t.replace(/\*\*/g, '');
const isEquation = (t) => /[=<>×÷+]/.test(t) || /^\d+[\/.]\d+/.test(t) || /^[^a-z]*$/.test(t);
const runOn = [], noEnd = [], lower = [];
for (const m of L.MODULES) {
  for (const sentence of strip(m.lesson.keyIdea || '').replace(/\[\[|\]\]/g, '').split(/(?<=[.!?])\s+|\n/)) {
    if (sentence.trim().split(/\s+/).length > 28) runOn.push(`${m.id}: ${sentence.trim().slice(0, 50)}`);
  }
  for (const paragraph of m.lesson.paragraphs || []) for (const raw of paragraph.split('\n')) {
    let t = raw.trim(); if (!t) continue;
    const centered = /^\[\[.*\]\]$/.test(t); t = strip(t.replace(/^\[\[|\]\]$/g, '')).trim();
    if (centered || isEquation(t) || t.split(/\s+/).length < 3) continue;
    if (!/[.!?:)"\u201d'\u2019]$/.test(t)) noEnd.push(`${m.id}: ${t.slice(0, 50)}`);
    if (/^[a-z]/.test(t)) lower.push(`${m.id}: ${t.slice(0, 50)}`);
  }
}
ok('no key idea runs a sentence past 28 words', runOn.length === 0, runOn.slice(0, 3).join(' | '));
ok('every lesson sentence ends with a mark', noEnd.length === 0, noEnd.slice(0, 3).join(' | '));
ok('every lesson sentence starts with a capital', lower.length === 0, lower.slice(0, 3).join(' | '));
console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;   // never process.exit(): it can drop the last lines of a piped stdout (2026-09-23)
