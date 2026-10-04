import { readFileSync } from 'node:fs';
// Tests for src/logic.mjs.  Run:  node tests/logic.test.mjs
// Any model (or person) can read PASS/FAIL lines below without knowing React.
import * as L from '../src/logic.mjs';
import { briefNews, recentNews } from '../tools/whats-new.mjs'; // What's new short notes and history (pass HL)

let pass = 0, fail = 0;
const ok = (label, cond, detail = '') => { console.log((cond ? 'PASS' : 'FAIL') + ' - ' + label + (cond ? '' : '  ' + detail)); cond ? pass++ : fail++; };
const val = (s) => { const [n, d] = s.split('/').map(Number); return n / d; }; // independent fraction value

// ---- 1. Every generator produces valid, correct questions across many seeds ----
const whenAnswers = new Map(); // event story -> the years it has been answered with, across every course
for (const [genId, gen] of Object.entries(L.GENERATORS)) {
  let bad = [];
  for (let seed = 1; seed <= 300; seed++) {
    const q = L.generateQuestion(genId, seed);
    if (q.prompt === 'When did this happen?' && q.story) { if (!whenAnswers.has(q.story)) whenAnswers.set(q.story, new Set()); whenAnswers.get(q.story).add(q.answer); }
    const problems = [];
    if (!q.prompt || !q.explain) problems.push('empty prompt/explain');
    if (q.type === 'choice') {
      if (!Array.isArray(q.choices) || q.choices.length < 2) problems.push('too few choices');
      if (q.choices.filter((c) => c === q.answer).length !== 1) problems.push('answer not exactly once in choices');
      if (new Set(q.choices).size !== q.choices.length) problems.push('duplicate choices');
      // fraction-valued choices must all be different amounts (no 2/4 vs 1/2 ambiguity)
      if (q.choices.every((c) => /^\d+\/\d+$/.test(c))) {
        const vals = q.choices.map(val);
        if (new Set(vals.map((v) => v.toFixed(9))).size !== vals.length) problems.push('two choices are the same amount');
      }
    } else if (q.type === 'number') {
      if (!/^\d+$/.test(q.answer)) problems.push('number answer is not a whole number');
    } else if (q.type === 'trace') {
      if (!L.TRACE_LETTERS[q.answer]) problems.push('trace letter has no strokes');
      if (q.traceKind === 'dots') { if (!q.prompt.includes(q.answer)) problems.push('dots prompt names a different picture'); }
      else if (q.traceKind === 'line') { if (!q.answer.startsWith('line-')) problems.push('line trace names a non-line'); }
      else if (q.traceKind === 'shape') { if (!q.prompt.includes(q.answer.slice(6))) problems.push('shape trace names a different shape'); }
      else if (q.traceKind === 'number') { if (q.answer !== q.prompt.match(/number (\d)/)[1]) problems.push('number trace prompt names a different number'); }
      else if (q.answer !== q.prompt.match(/letter ([A-Za-z])/)[1]) problems.push('trace prompt names a different letter');
      // an ideal tracing of the letter must pass, and a tracing of a different letter must fail
      const ideal = L.TRACE_LETTERS[q.answer].strokes.map((st) => st.flatMap((p, i) => (i === 0 ? [p] : Array.from({ length: 6 }, (_, k) => [st[i - 1][0] + ((p[0] - st[i - 1][0]) * (k + 1)) / 6, st[i - 1][1] + ((p[1] - st[i - 1][1]) * (k + 1)) / 6]))));
      if (!L.checkAnswer(q, JSON.stringify(ideal))) problems.push('an ideal tracing does not pass');
      const other = Object.keys(L.TRACE_LETTERS).find((k) => k !== q.answer && /^[A-Z]$/.test(k) && k !== 'E' && k !== 'F' && k !== 'H' && q.answer !== 'I');
      if (other && L.TRACE_LETTERS[other] && ['L', 'T', 'V', 'O', 'C'].includes(q.answer) && L.checkAnswer(q, JSON.stringify(L.TRACE_LETTERS[other].strokes))) problems.push(`tracing ${other} passes as ${q.answer}`);
    } else if (q.type === 'order') {
      if (!Array.isArray(q.items) || q.items.length < 3) problems.push('order needs three or more pieces');
      if (new Set(q.items).size !== q.items.length) problems.push('order pieces repeat');
      if ([...q.items].sort().join('|') !== q.answer.split(' | ').sort().join('|')) problems.push('order answer is not the same pieces');
      if (q.items.join(' | ') === q.answer) problems.push('order already in order');
      if (!L.checkAnswer(q, q.answer) || L.checkAnswer(q, q.items.join(' | '))) problems.push('order judging wrong');
    } else if (q.type === 'writing') {
      if (!q.prompt || q.prompt.length < 20) problems.push('writing prompt too short');
      if (!Array.isArray(q.checklist) || q.checklist.length < 3) problems.push('writing needs a checklist of three or more');
      if (!(q.minWords > 0)) problems.push('writing needs a word target');
      if (L.checkAnswer(q, 'anything at all')) problems.push('writing must never be auto-judged');
    } else problems.push('unknown type');
    // Independent arithmetic re-check of the answer, per generator family
    const text = (q.story ? q.story + ' ' : '') + q.prompt; // the full question as the learner reads it
    const nums = text.match(/\d+\/\d+/g) || [];
    if (genId === 'm3-same-bottom' || genId === 'm3-same-top' || genId === 'm3-different') {
      const [a, b] = nums; if (Math.max(val(a), val(b)) !== val(q.answer)) problems.push('bigger fraction is wrong');
    }
    if (genId === 'm3-smallest-of-three') {
      const min = Math.min(...nums.map(val)); if (val(q.answer) !== min) problems.push('smallest fraction is wrong');
    }
    if (genId === 'm3-true-false') {
      const [a, b] = nums; if ((val(a) > val(b) ? 'True' : 'False') !== q.answer) problems.push('true/false is wrong');
    }
    if (genId === 'm2-which-equals') { if (Math.abs(val(nums[0]) - val(q.answer)) > 1e-9) problems.push('not equivalent'); }
    if (genId === 'm2-simplify') { const [f] = nums; if (Math.abs(val(f) - val(q.answer)) > 1e-9) problems.push('simplified value differs'); const [n, d] = q.answer.split('/').map(Number); if (L.gcd(n, d) !== 1) problems.push('not in simplest form'); }
    if (genId === 'm2-fill-bottom') { const [a, b] = nums[0].split('/').map(Number); const top = Number(text.match(/= (\d+)\//)[1]); if (top * b !== a * Number(q.answer)) problems.push('fill-bottom arithmetic wrong'); }
    if (genId === 'm2-fill-top') { const [a, b] = nums[0].split('/').map(Number); const bottom = Number(text.match(/__\/(\d+)/)[1]); if (Number(q.answer) * b !== a * bottom) problems.push('fill-top arithmetic wrong'); }
    if (genId === 'm2-equivalent-or-not') { const [a, b] = nums; const same = Math.abs(val(a) - val(b)) < 1e-9; if ((same ? 'Yes' : 'No') !== q.answer.slice(0, same ? 3 : 2)) problems.push('equivalence yes/no wrong'); }
    if (genId === 'm1-part-eaten') { const n = Number(text.match(/into (\d+) equal/)[1]); const m = Number(text.match(/eat (\d+)/)[1]); if (q.answer !== `${m}/${n}`) problems.push('part eaten wrong'); }
    if (genId === 'm1-part-left') { const n = Number(text.match(/into (\d+) equal/)[1]); const m = Number(text.match(/\. (\d+) /)[1]); if (q.answer !== `${n - m}/${n}`) problems.push('part left wrong'); }
    if (genId === 'm1-picture') { if (q.answer !== `${q.visual.shaded}/${q.visual.parts}`) problems.push('picture answer does not match drawing'); }
    if (genId === 'm1-top-or-bottom') { const n = Number(text.match(/into (\d+) equal/)[1]); const m = Number(text.match(/eat (\d+)/)[1]); const want = /top number/.test(q.prompt) ? m : n; if (Number(q.answer) !== want) problems.push('top/bottom wrong'); }
    if (q.visual && q.visual.kind === 'letters') { if (typeof q.visual.text !== 'string' || !q.visual.text.trim()) problems.push('letters visual empty'); }
    else if (q.visual && q.visual.kind === 'dots') { if (!(Number.isInteger(q.visual.count) && q.visual.count >= 1 && q.visual.count <= 10)) problems.push('dots out of range'); }
    else if (q.visual && q.visual.kind === 'shape') { /* checked below */ }
    else if (q.visual && q.visual.kind === 'tens') { if (!(q.visual.count >= 1 && q.visual.count <= 10)) problems.push('tens out of range'); }
    else if (q.visual && q.visual.kind === 'bars') { if (!q.visual.lengths.every((n) => n >= 1 && n <= 9)) problems.push('bar out of range'); }
    else if (q.visual && q.visual.kind === 'solid') { if (!['sphere', 'cube', 'cylinder', 'cone'].includes(q.visual.name)) problems.push('unknown solid'); }
    else if (q.visual && q.visual.kind === 'tenframe') { if (!(q.visual.filled >= 0 && q.visual.filled <= 10)) problems.push('ten frame out of range'); }
    else if (q.visual && q.visual.kind === 'array') { if (!(q.visual.rows >= 1 && q.visual.rows <= 10 && q.visual.cols >= 1 && q.visual.cols <= 10)) problems.push('array out of range'); }
    else if (q.visual && q.visual.kind === 'numberline' && q.visual.parts !== undefined) { if (!(q.visual.parts >= 2 && q.visual.mark >= 0 && q.visual.mark <= q.visual.parts)) problems.push('number line out of range'); }
    else if (q.visual && q.visual.kind === 'bar') { if (!(q.visual.shaded >= 0 && q.visual.shaded <= q.visual.parts)) problems.push('bar picture out of range'); }
    else if (q.visual && q.visual.kind === 'swatch') { if (!['red', 'blue', 'yellow', 'green'].includes(q.visual.colour)) problems.push('unknown colour'); }
    else if (q.visual && q.visual.kind === 'item') { if (!q.visual.shape || !q.visual.colour) problems.push('item incomplete'); }
    else if (q.visual && q.visual.kind === 'pattern') { if (!Array.isArray(q.visual.items) || (q.visual.counting ? q.visual.items.length < 1 : q.visual.items.length < 3)) problems.push('pattern too short'); } // a counting row (pass HS) may hold one shape
    else if (q.visual && q.visual.kind === 'clock') { if (!(q.visual.hour >= 1 && q.visual.hour <= 12 && [0, 15, 30, 45].includes(q.visual.minute))) problems.push('clock out of range'); }
    else if (q.visual && q.visual.kind === 'icon') { if (!['sun', 'moon', 'cloud', 'rain', 'snow', 'plant', 'tree', 'flower', 'fish', 'bird', 'rock', 'drop', 'ice', 'fire', 'magnet', 'clip', 'nail', 'cup', 'bus', 'dog', 'hat', 'bed', 'fan'].includes(q.visual.name)) problems.push('unknown icon'); }
    else if (q.visual && (q.visual.kind === 'pic' || q.visual.kind === 'art')) { if (!q.visual.name) problems.push('picture incomplete'); }
    else if (q.visual && q.visual.kind === 'numberline') { if (!(q.visual.from < q.visual.to && (q.visual.marks || [q.visual.mark]).every((v) => v === null || v === undefined || (v >= q.visual.from && v <= q.visual.to)))) problems.push('number line out of range'); }
    else if (q.visual && (q.visual.kind === 'tri' || q.visual.kind === 'para')) { if (!(q.visual.base > 0 && (q.visual.height === '?' || q.visual.height > 0))) problems.push('shape measures missing'); }
    else if (q.visual && q.visual.kind === 'cell') { if (typeof q.visual.highlight !== 'string') problems.push('cell visual needs a highlight'); }
    else if (q.visual && q.visual.kind === 'percentgrid') { if (!(q.visual.shaded >= 0 && q.visual.shaded <= 100)) problems.push('percent grid out of range'); }
    else if (q.visual && q.visual.kind === 'groups') { if (!(Number.isInteger(q.visual.a) && Number.isInteger(q.visual.b) && q.visual.a >= 0 && q.visual.b >= 0)) problems.push('groups out of range'); }
    else if (q.visual && q.visual.kind === 'angles') { if (!(['vertical', 'supplementary', 'triangle'].includes(q.visual.type) && q.visual.given > 0 && q.visual.given < 180)) problems.push('angles out of range'); }
    else if (q.visual && q.visual.kind === 'lightray') { if (!(q.visual.angle > 0 && q.visual.angle < 90)) problems.push('light ray out of range'); }
    else if (q.visual && q.visual.kind === 'alleles') { if (!/^[Bb]{2}$/.test(q.visual.pair)) problems.push('alleles malformed'); }
    else if (q.visual && q.visual.kind === 'beaker') { if (!(q.visual.moles > 0 && q.visual.liters > 0)) problems.push('beaker out of range'); }
    else if (q.visual && q.visual.kind === 'periodic') { if (!((q.visual.highlight || []).every((s) => typeof s === 'string' && s.length) && (q.visual.period === null || q.visual.period === undefined || (q.visual.period >= 1 && q.visual.period <= 7)) && (q.visual.group === null || q.visual.group === undefined || (q.visual.group >= 1 && q.visual.group <= 18)))) problems.push('periodic visual out of range'); }
    else if (q.visual && q.visual.kind === 'plot') { if (!(q.visual.fn !== 'point' || (q.visual.px >= 0 && q.visual.px <= 6 && q.visual.py >= 0 && q.visual.py <= 6))) problems.push('plot point out of range'); }
    else if (q.visual && !(q.visual.shaded >= 0 && q.visual.shaded <= q.visual.parts)) problems.push('visual out of range');
    // Independent checks for the counting questions (a 'dots:N' choice is a picture of N things)
    const dotCount = (c) => Number((/^dots:(\d+)$/.exec(c) || [])[1]);
    if (/^k(5|10)-how-many$/.test(genId) && String(q.visual.count) !== q.answer) problems.push('how-many answer does not match the picture');
    if (/^k(5|10)-tap-group$/.test(genId) && dotCount(q.answer) !== Number(q.prompt.match(/with (\d+)/)[1])) problems.push('tap-group answer does not match the prompt');
    if (/^k(5|10)-more$/.test(genId) && dotCount(q.answer) !== Math.max(...q.choices.map(dotCount))) problems.push('more picked the smaller group');
    if (/^k(5|10)-fewer$/.test(genId) && dotCount(q.answer) !== Math.min(...q.choices.map(dotCount))) problems.push('fewer picked the bigger group');
    if (/^k(5|10)-after$/.test(genId) && Number(q.answer) !== Number(q.prompt.match(/after (\d+)/)[1]) + 1) problems.push('after is not n+1');
    if (/^k(5|10)-same$/.test(genId) && dotCount(q.answer) !== q.visual.count) problems.push('same does not match the picture');
    const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (genId === 'r-tap-letter' && q.answer !== q.prompt.match(/letter ([A-Z])/)[1]) problems.push('tap-letter answer mismatch');
    if (genId === 'r-after' && q.answer !== AZ[AZ.indexOf(q.prompt.match(/after ([A-Z])/)[1]) + 1]) problems.push('after is not the next letter');
    if (genId === 'r-before' && q.answer !== AZ[AZ.indexOf(q.prompt.match(/before ([A-Z])/)[1]) - 1]) problems.push('before is not the previous letter');
    if (genId === 'r-first-letter' && q.answer !== q.story.match(/word ([A-Z]+)/)[1][0]) problems.push('first letter wrong');
    if (genId === 'r-count-letters' && Number(q.answer) !== q.story.match(/word ([A-Z]+)/)[1].length) problems.push('letter count wrong');
    if (genId === 'r-match-small' && q.answer !== q.story.match(/big ([A-Z])/)[1].toLowerCase()) problems.push('small letter mismatch');
    if (genId === 'r-match-big' && q.answer !== q.story.match(/small ([a-z])/)[1].toUpperCase()) problems.push('big letter mismatch');
    // Independent re-derivation for the kindergarten number-sense questions, from the words alone
    const words = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
    const firstWord = (t) => words[(t || '').trim().split(/\s+/)[0].toLowerCase()];
    const ints = text.match(/\d+/g) ? text.match(/\d+/g).map(Number) : [];
    if (genId === 'km-one-more' && Number(q.answer) !== ints[0] + 1) problems.push('one more is not n+1');
    if (genId === 'km-one-less' && Number(q.answer) !== ints[0] - 1) problems.push('one less is not n-1');
    if (genId === 'km-one-more-pic' && dotCount(q.answer) !== ints[0] + 1) problems.push('one-more picture is not n+1');
    if (genId === 'km-one-less-pic' && dotCount(q.answer) !== ints[0] - 1) problems.push('one-less picture is not n-1');
    if (genId === 'km-which-neighbour') { const n = ints[0]; const want = /more/.test(q.prompt) ? n + 1 : n - 1; if (Number(q.answer) !== want) problems.push('neighbour wrong'); }
    if (genId === 'km-join-story') { const a = firstWord(q.story); const b = ints[0]; if (Number(q.answer) !== a + b) problems.push('join total wrong'); }
    if (genId === 'km-take-story') { const a = firstWord(q.story); const b = ints[0]; if (Number(q.answer) !== a - b) problems.push('take-away remainder wrong'); }
    if (genId === 'km-join-pic' && dotCount(q.answer) !== ints[0] + ints[1]) problems.push('join picture wrong');
    if (genId === 'km-take-pic' && dotCount(q.answer) !== ints[0] - ints[1]) problems.push('take picture wrong');
    if (genId === 'km-how-many-more' && Number(q.answer) !== ints[1] - ints[0]) problems.push('how many more wrong');
    if (genId === 'km-bigger' && Number(q.answer) !== Math.max(...q.choices.map(Number))) problems.push('bigger picked the smaller');
    if (genId === 'km-smaller' && Number(q.answer) !== Math.min(...q.choices.map(Number))) problems.push('smaller picked the bigger');
    if (genId === 'km-more-less-same') { const [a, b] = ints; const want = a > b ? 'More' : a < b ? 'Less' : 'The same'; if (q.answer !== want) problems.push('more/less/same wrong'); }
    if (genId === 'km-make-more' && !(dotCount(q.answer) > ints[0])) problems.push('make-more is not more');
    if (genId === 'km-make-fewer' && !(dotCount(q.answer) < ints[0])) problems.push('make-fewer is not fewer');
    if (/^km-/.test(genId) && q.explainVisual && !(q.explainVisual.count >= 1 && q.explainVisual.count <= 10)) problems.push('explain picture out of range');
    // Shapes, re-derived from a table the generator does not share
    const SIDES = { circle: 0, triangle: 3, square: 4, rectangle: 4 };
    const shapeOf = (c) => String(c).replace(/^shape:/, '').split('#')[0];
    if (genId === 'ks-name' && q.answer !== q.visual.name) problems.push('named the wrong shape');
    if (genId === 'ks-tap' && shapeOf(q.answer) !== q.prompt.match(/Tap the (\w+)/)[1]) problems.push('tapped the wrong shape');
    if (genId === 'ks-sides' && Number(q.answer) !== SIDES[q.visual.name]) problems.push('side count wrong');
    if (genId === 'ks-odd-one-out') { const names = q.choices.map(shapeOf); const odd = names.find((n) => names.filter((x) => x === n).length === 1); if (shapeOf(q.answer) !== odd) problems.push('odd one out wrong'); }
    if (genId === 'ks-corners' && q.answer !== (SIDES[q.visual.name] > 0 ? 'Yes' : 'No')) problems.push('corners yes/no wrong');
    if (q.visual && q.visual.kind === 'shape' && !SIDES.hasOwnProperty(q.visual.name)) problems.push('unknown shape');
    // Tens, lengths, sorting: re-derived from the words and the pictures
    const num = (c, key) => Number((new RegExp(`^${key}:(\\d+)$`).exec(c) || [])[1]);
    if (genId === 'kt-next-ten' && Number(q.answer) !== Number(q.prompt.match(/after (\d+)/)[1]) + 10) problems.push('next ten wrong');
    if (genId === 'kt-before-ten' && Number(q.answer) !== Number(q.prompt.match(/before (\d+)/)[1]) - 10) problems.push('previous ten wrong');
    if (genId === 'kt-how-many-tens' && Number(q.answer) !== q.visual.count * 10) problems.push('tens count wrong');
    if (genId === 'kt-tap-tens' && num(q.answer, 'tens') * 10 !== Number(q.prompt.match(/shows (\d+)/)[1])) problems.push('tapped tens wrong');
    if (genId === 'kt-count-on') { const [a] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) !== a + 20) problems.push('count on wrong'); }
    if (genId === 'kl-longer' && num(q.answer, 'bar') !== Math.max(...q.choices.map((c) => num(c, 'bar')))) problems.push('longer wrong');
    if (genId === 'kl-shorter' && num(q.answer, 'bar') !== Math.min(...q.choices.map((c) => num(c, 'bar')))) problems.push('shorter wrong');
    if (genId === 'kl-same-length' && num(q.answer, 'bar') !== q.visual.lengths[0]) problems.push('same length wrong');
    if (genId === 'kl-taller' && num(q.answer, 'tower') !== Math.max(...q.choices.map((c) => num(c, 'tower')))) problems.push('taller wrong');
    if (genId === 'kl-heavier-words' && !/rock|book|bucket|chair|car|brick/.test(q.answer)) problems.push('heavier picked the light thing');
    if (genId === 'ko-belongs' && q.answer !== `shape:${q.story.match(/the (\w+) group/)[1]}`) problems.push('belongs wrong');
    if (genId === 'ko-count-group' && Number(q.answer) !== q.visual.count) problems.push('group count wrong');
    if (genId === 'ko-which-group-more') { const [a, b] = q.story.match(/\d+/g).map(Number); if (q.answer !== (a > b ? 'Circles' : 'Squares')) problems.push('more group wrong'); }
    if (genId === 'ko-does-not-belong' && shapeOf(q.answer) === q.story.match(/the (\w+) group/)[1]) problems.push('odd one is in the group');
    if (genId === 'ko-how-many-groups' && Number(q.answer) !== q.story.replace(/\.$/, '').split(', ').length) problems.push('group count wrong');
    // Solids and making ten
    const THING = { 'a ball': 'sphere', 'a block': 'cube', 'a can': 'cylinder', 'an ice cream cone': 'cone' };
    const ROLLS = { sphere: 'Yes', cube: 'No', cylinder: 'Yes', cone: 'Yes' };
    if (genId === 'kd-name-solid' && q.answer !== q.visual.name) problems.push('named the wrong solid');
    if (genId === 'kd-tap-solid' && q.answer !== `solid:${q.prompt.match(/Tap the (\w+)/)[1]}`) problems.push('tapped the wrong solid');
    if (genId === 'kd-real-thing' && q.answer !== THING[q.prompt.match(/What solid shape is (.+)\?/)[1]] /* pass ID: the thing is named in the question */) problems.push('real thing wrong');
    if (genId === 'kd-flat-or-solid' && q.answer !== (q.visual.kind === 'solid' ? 'Solid' : 'Flat')) problems.push('flat/solid wrong');
    if (genId === 'kd-rolls' && q.answer !== ROLLS[q.visual.name]) problems.push('rolls wrong');
    if ((genId === 'kn-partner' || genId === 'kn-frame') && Number(q.answer) !== 10 - q.visual.filled) problems.push('partner of ten wrong');
    if (genId === 'kn-two-ways') { const [a, b] = q.answer.split(' and ').map(Number); if (a + b !== 10) problems.push('pair does not make ten'); if (q.choices.filter((c) => c.split(' and ').map(Number).reduce((x, y) => x + y) === 10).length !== 1) problems.push('two pairs make ten'); }
    if (genId === 'kn-take-from-ten' && Number(q.answer) !== 10 - Number(q.story.match(/then (\d+)/)[1])) problems.push('take from ten wrong');
    if (genId === 'kn-is-ten') { const [a, b] = q.story.match(/\d+/g).map(Number); if (q.answer !== (a + b === 10 ? 'Yes' : 'No')) problems.push('is-ten wrong'); }
    // Syllables, sounding out, reading direction, word meanings
    const SYL = { cat: 1, dog: 1, sun: 1, hat: 1, fish: 1, ball: 1, rabbit: 2, apple: 2, window: 2, pencil: 2, monkey: 2, tiger: 2, banana: 3, elephant: 3, umbrella: 3, butterfly: 3 };
    if (genId === 'ry-how-many-claps' && Number(q.answer) !== SYL[q.visual.text]) problems.push('clap count wrong');
    if (genId === 'ry-pick-two' && SYL[q.answer] !== 2) problems.push('pick-two wrong');
    if (genId === 'ry-pick-one' && SYL[q.answer] !== 1) problems.push('pick-one wrong');
    if (genId === 'ry-more-claps' && SYL[q.answer] !== Math.max(...q.choices.map((c) => SYL[c]))) problems.push('more claps wrong');
    if (genId === 'ry-same-claps' && SYL[q.answer] !== SYL[q.story.replace(/\.$/, '').toLowerCase()]) problems.push('same claps wrong');
    if (genId === 'rd-blend' && q.answer !== q.visual.text.replace(/ /g, '')) problems.push('blend wrong');   // pass JV: the setup names the letters
    if (genId === 'rd-first-sound' && q.answer !== q.story.replace(/\.$/, '').toLowerCase()[0]) problems.push('first sound wrong');
    if (genId === 'rd-last-sound' && q.answer !== q.story.replace(/\.$/, '').toLowerCase().slice(-1)) problems.push('last sound wrong');
    if (genId === 'rd-middle-sound' && q.answer !== q.story.replace(/\.$/, '').toLowerCase()[1]) problems.push('middle sound wrong');
    if (genId === 'rd-which-word' && q.answer !== q.visual.text.replace(/ /g, '')) problems.push('which word wrong');
    const lineWords = (t) => t.trim().split(/\s+/);
    if (genId === 'rw-first' && q.answer !== lineWords(q.story)[0]) problems.push('first word wrong');
    if (genId === 'rw-last' && q.answer !== lineWords(q.story).slice(-1)[0]) problems.push('last word wrong');
    if (genId === 'rw-next') { const ws = lineWords(q.story); const after = q.prompt.match(/after the word (\w+)\?/)[1]; /* pass IB: right after the word the? */ if (q.answer !== ws[ws.indexOf(after) + 1]) problems.push('next word wrong'); }
    if (genId === 'rw-count-words' && Number(q.answer) !== lineWords(q.story).length) problems.push('word count wrong');
    if (genId === 'rw-which-way' && q.answer !== (/left to right/.test(q.story) ? 'Yes' : 'No')) problems.push('which way wrong');
    const PIC_WORD = { circle: 'circle', square: 'square', triangle: 'triangle', rectangle: 'rectangle', sphere: 'ball', cube: 'box', cylinder: 'can', cone: 'cone' };
    if (genId === 'rm-match-picture' && q.answer !== PIC_WORD[q.visual.name]) problems.push('picture word wrong');
    if (genId === 'rm-pick-word' && PIC_WORD[q.answer.split(':')[1]] !== q.story.match(/word is (\w+)/)[1]) problems.push('picked picture wrong');
    if (genId === 'rm-does-match' && q.answer !== (PIC_WORD[q.visual.name] === q.story.match(/says (\w+)/)[1] ? 'Yes' : 'No')) problems.push('does-match wrong');
    if (genId === 'rm-count-word' && ['one', 'two', 'three', 'four', 'five', 'six'].indexOf(q.answer) + 1 !== q.visual.count) problems.push('count word wrong');
    if (genId === 'rm-shape-word' && q.answer !== `shape:${q.story.match(/word:? (\w+)/)[1]}`) problems.push('shape word wrong');
    // Grade 3 multiplication, division, and adding to 1,000: redone from the numbers in the words
    const allInts = text.match(/\d+/g) ? text.match(/\d+/g).map(Number) : [];
    if (genId === 'mu-groups-total' && Number(q.answer) !== allInts[0] * allInts[1]) problems.push('groups total wrong');
    if (genId === 'mu-array' && q.answer !== `${q.visual.rows} × ${q.visual.cols}`) problems.push('array equation wrong');
    if (genId === 'mu-story' && Number(q.answer) !== allInts[0] * allInts[1]) problems.push('multiplication story wrong');
    if (genId === 'mu-which-equation') { const [g, e] = allInts; if (q.answer !== `${g} × ${e} = ${g * e}`) problems.push('which equation wrong'); }
    if (genId === 'mu-swap') { const [a, b] = allInts; if (Number(q.answer) !== a * b) problems.push('swap wrong'); }
    if ((genId === 'tt-fact' || genId === 'tt-fact-story') && Number(q.answer) !== allInts[0] * allInts[1]) problems.push('times fact wrong');
    if (genId === 'tt-missing-factor') { const [a, p] = allInts; if (a * Number(q.answer) !== p) problems.push('missing factor wrong'); }
    if (genId === 'tt-pattern') { const m2 = q.prompt.match(/(\d+) × (\d+)/); if (Number(q.answer) !== Number(m2[1]) * Number(m2[2])) problems.push('pattern fact wrong'); }
    if (genId === 'dv-share') { const [total, groups] = allInts; if (Number(q.answer) * groups !== total) problems.push('share wrong'); }
    if (genId === 'dv-fact') { const [t, b] = allInts; if (Number(q.answer) * b !== t) problems.push('division fact wrong'); }
    if (genId === 'dv-story') { const [total, each] = allInts; if (Number(q.answer) * each !== total) problems.push('division story wrong'); }
    if (genId === 'dv-undo') { const [a, b] = allInts; if (q.answer !== `${a * b} ÷ ${a} = ${b}`) problems.push('undo fact wrong'); }
    if (genId === 'dv-how-many-groups') { const [total, each] = allInts; if (Number(q.answer) * each !== total) problems.push('how many groups wrong'); }
    if (genId === 'as-add' || genId === 'as-story-add') { const [a, b] = allInts; if (Number(q.answer) !== a + b) problems.push('addition wrong'); if (a + b > 999) problems.push('sum over 1000'); }
    if (genId === 'as-subtract' || genId === 'as-story-subtract') { const [a, b] = allInts; if (Number(q.answer) !== a - b) problems.push('subtraction wrong'); if (a - b < 0) problems.push('negative result'); }
    if (genId === 'as-two-step') { const [a, b, c] = allInts; if (Number(q.answer) !== a + b - c) problems.push('two-step wrong'); if (a + b - c < 0) problems.push('two-step negative'); }
    // Number line and building fractions
    if (genId === 'nl-which-fraction' && q.answer !== `${q.visual.mark}/${q.visual.parts}`) problems.push('number line fraction wrong');
    if (genId === 'nl-how-many-steps' && Number(q.answer) !== q.visual.parts) problems.push('steps wrong');
    if (genId === 'nl-place' && Number(q.answer) !== q.visual.mark) problems.push('place wrong');
    if (genId === 'nl-halfway' && Math.abs(val(q.answer) - 0.5) > 1e-9) problems.push('halfway is not one half');
    if (genId === 'nl-closer-to' && q.answer !== (q.visual.mark / q.visual.parts < 0.5 ? '0' : '1')) problems.push('closer-to wrong');
    if (genId === 'bf-how-many-units' && Number(q.answer) !== q.visual.shaded) problems.push('unit count wrong');
    if (genId === 'bf-sum-of-units') { const terms = q.answer.split(' + '); if (terms.length !== q.visual.shaded || !terms.every((t) => t === `1/${q.visual.parts}`)) problems.push('sum of units wrong'); }
    if (genId === 'bf-split') { const [x, y] = q.answer.split(' + '); if (Math.abs(val(x) + val(y) - q.visual.shaded / q.visual.parts) > 1e-9) problems.push('split does not add up'); }
    if (genId === 'bf-share') { const [things, people] = allInts; if (q.answer !== `${things}/${people}`) problems.push('share wrong'); }
    // Pre-K, re-derived from the words and picture specs
    const spec = (c) => String(c).replace(/^item:/, '').split('#')[0].split('-');
    if (genId === 'pc-tap-colour' && q.answer !== `swatch:${q.prompt.match(/Tap (?:the )?(\w+)/)[1]}`) problems.push('tapped colour wrong');
    if (genId === 'pc-name-colour' && q.answer !== q.visual.colour) problems.push('named colour wrong');
    if (genId === 'pc-same-colour' && spec(q.answer)[1] !== q.visual.colour) problems.push('same colour wrong');
    if (genId === 'pc-different-colour') { const cols = q.choices.map((c) => spec(c)[1]); const odd = q.choices.find((c) => cols.filter((x) => x === spec(c)[1]).length === 1); if (q.answer !== odd) problems.push('different colour wrong'); }
    if (genId === 'ps-find-match' && (spec(q.answer)[0] !== q.visual.shape || spec(q.answer)[1] !== q.visual.colour)) problems.push('match wrong');
    if (genId === 'ps-odd-one-out') { const shapes = q.choices.map((c) => spec(c)[0]); const odd = q.choices.find((c) => shapes.filter((x) => x === spec(c)[0]).length === 1); if (q.answer !== odd) problems.push('odd shape wrong'); }
    if (genId === 'ps-same-colour-shape' && (spec(q.answer)[0] !== q.visual.shape || spec(q.answer)[1] !== q.visual.colour)) problems.push('exact match wrong');
    if (genId === 'ps-bigger' && spec(q.answer)[2] !== 'big') problems.push('bigger wrong');
    if (genId === 'ps-smaller' && spec(q.answer)[2] !== 'small') problems.push('smaller wrong');
    if (genId === 'pp-what-next') { const it = q.visual.items; if (spec(q.answer)[0] !== it[it.length % 2 === 0 ? 0 : 1]) problems.push('what next wrong'); }
    if (genId === 'pp-which-repeats') { const it = q.visual.items; const repeats = it.every((x, i) => x === it[i % 2]); if (q.answer !== (repeats ? 'Yes' : 'No')) problems.push('repeats wrong'); }
    if (genId === 'pp-missing') { const it = q.visual.items; const i = it.indexOf('?'); if (spec(q.answer)[0] !== it[i % 2 === 0 ? 0 : 1]) problems.push('missing wrong'); }
    if (genId === 'p3-how-many' && Number(q.answer) !== (q.visual.counting ? q.visual.items.length : q.visual.count)) problems.push('pre-K how many wrong'); // dots or a counting row (pass HS)
    if (genId === 'p3-tap-group' && dotCount(q.answer) !== Number(q.prompt.match(/Tap (?:the group of )?(\d)/)[1])) problems.push('pre-K tap group wrong');
    if (genId === 'p3-tap-one' && dotCount(q.answer) !== 1) problems.push('tap one wrong');
    if (genId === 'p3-more' && dotCount(q.answer) !== Math.max(...q.choices.map(dotCount))) problems.push('pre-K more wrong');
    // Grade 1, re-derived from the numbers in the words
    const g1 = text.match(/\d+/g) ? text.match(/\d+/g).map(Number) : [];
    if (genId === 'g1-ten-and' && Number(q.answer) !== 10 + g1[0]) problems.push('ten-and wrong');
    if (genId === 'g1-teen-split' && Number(q.answer) !== g1[0] - 10) problems.push('teen split wrong');
    if (genId === 'g1-teen-pic' && Number(q.answer) !== 10 + q.visual.count) problems.push('teen picture wrong');
    if (genId === 'g1-which-teen' && dotCount(q.answer) !== g1[0] - 10) problems.push('which teen wrong');
    if (genId === 'g1-teen-after' && Number(q.answer) !== g1[0] + 1) problems.push('teen after wrong');
    if ((genId === 'g1-add' || genId === 'g1-add-story') && Number(q.answer) !== g1[0] + g1[1]) problems.push('grade 1 add wrong');
    if (genId === 'g1-make-ten-add') { const m2 = q.prompt.match(/(\d+) \+ (\d+)\?/); if (Number(q.answer) !== Number(m2[1]) + Number(m2[2])) problems.push('make ten add wrong'); }
    if (genId === 'g1-add-pic' && dotCount(q.answer) !== g1[0] + g1[1]) problems.push('add picture wrong');
    if (genId === 'g1-add-missing' && g1[0] + Number(q.answer) !== g1[1]) problems.push('missing addend wrong');
    if ((genId === 'g1-sub' || genId === 'g1-sub-story') && Number(q.answer) !== g1[0] - g1[1]) problems.push('grade 1 subtract wrong');
    if (genId === 'g1-sub-undo') { const [a, b] = g1; if (Number(q.answer) !== a) problems.push('sub undo wrong'); }
    if (genId === 'g1-sub-pic' && dotCount(q.answer) !== g1[0] - g1[1]) problems.push('sub picture wrong');
    if (genId === 'g1-compare-diff' && Number(q.answer) !== g1[0] - g1[1]) problems.push('difference wrong');
    if (genId === 'g1-tens-ones' && Number(q.answer) !== g1[0] * 10 + g1[1]) problems.push('tens and ones wrong');
    if (genId === 'g1-how-many-tens' && Number(q.answer) !== Math.floor(g1[0] / 10)) problems.push('how many tens wrong');
    if (genId === 'g1-how-many-ones' && Number(q.answer) !== g1[0] % 10) problems.push('how many ones wrong');
    if (genId === 'g1-build-number') { const [t, o] = q.answer.match(/\d+/g).map(Number); const target = Number(q.prompt.match(/\d+/)[0]); if (t * 10 + o !== target) problems.push('build number wrong'); }
    if (genId === 'g1-ten-more' && Number(q.answer) !== g1[0] + 10) problems.push('ten more wrong');
    if (genId === 'g1-bigger' && Number(q.answer) !== Math.max(...q.choices.map(Number))) problems.push('grade 1 bigger wrong');
    if (genId === 'g1-smaller' && Number(q.answer) !== Math.min(...q.choices.map(Number))) problems.push('grade 1 smaller wrong');
    if (genId === 'g1-between') { const [lo, hi] = g1; const a = Number(q.answer); if (!(a > lo && a < hi)) problems.push('between wrong'); }
    if (genId === 'g1-order-three') { const arr = q.answer.split(', ').map(Number); if (!arr.every((v, i) => i === 0 || v > arr[i - 1])) problems.push('order wrong'); }
    if (genId === 'g1-more-less-same') { const [a, b] = g1; if (q.answer !== (a > b ? 'More' : a < b ? 'Less' : 'The same')) problems.push('grade 1 more/less/same wrong'); }
    // Grade 1 reading, re-derived from the shown word or sentence
    const shown = q.visual && q.visual.kind === 'letters' ? q.visual.text : '';
    const PICW = { 'solid:cube': 'box', 'solid:cylinder': 'can', 'art:ball': 'ball', 'solid:cone': 'cone', 'pic:cat': 'cat', 'icon:sun': 'sun', 'pic:fish': 'fish', 'art:boat': 'boat', 'art:car': 'car', 'icon:tree': 'tree' };
    const NUMW = ['one', 'two', 'three', 'four', 'five', 'six'];
    const DIG = (w) => (['sh', 'ch', 'th'].find((d) => w.startsWith(d)) || ['sh', 'ch', 'th'].find((d) => w.endsWith(d)));
    if (genId === 'r1-word-picture' && PICW[q.answer] !== shown) problems.push('word picture wrong');
    if (genId === 'r1-word-colour' && q.answer !== `swatch:${shown}`) problems.push('word colour wrong');
    if (genId === 'r1-word-number' && dotCount(q.answer) !== NUMW.indexOf(shown) + 1) problems.push('word number wrong');
    if (genId === 'r1-which-word' && q.answer !== PICW[`${q.visual.kind}:${q.visual.name}`]) problems.push('which word wrong');
    if (genId === 'r1-word-shape' && q.answer !== `shape:${shown}`) problems.push('word shape wrong');
    if (genId === 'r1-starts-with' && !shown.startsWith(q.answer)) problems.push('starts-with wrong');
    if (genId === 'r1-ends-with' && !shown.endsWith(q.answer)) problems.push('ends-with wrong');
    if (genId === 'r1-which-pair' && DIG(q.answer) !== shown) problems.push('which pair wrong');
    if (genId === 'r1-same-pair' && DIG(q.answer) !== DIG(shown)) problems.push('same pair wrong');
    if (genId === 'r1-odd-pair') { const ds = q.choices.map(DIG); const odd = q.choices.find((c) => ds.filter((d) => d === DIG(c)).length === 1); if (q.answer !== odd) problems.push('odd pair wrong'); }
    if (genId === 'r1-add-e' && q.answer !== shown + 'e' && q.answer.slice(0, -1) !== shown) problems.push('add e wrong');
    if (genId === 'r1-has-silent-e' && q.answer !== (shown.endsWith('e') ? 'Yes' : 'No')) problems.push('silent e yes/no wrong');
    if (genId === 'r1-long-or-short' && q.answer !== (shown.endsWith('e') ? 'Yes' : 'No')) problems.push('long or short wrong');
    if (genId === 'r1-pick-long' && !q.answer.endsWith('e')) problems.push('pick long wrong');
    if (genId === 'r1-take-e' && q.answer + 'e' !== shown) problems.push('take e wrong');
    if (genId === 'r1-sentence-picture') { const m2 = shown.match(/The (\w+) is (\w+)\./); if (q.answer !== `item:${m2[1]}-${m2[2]}`) problems.push('sentence picture wrong'); }
    if (genId === 'r1-sentence-which' && q.answer !== `The ${q.visual.shape} is ${q.visual.colour}.`) problems.push('sentence which wrong');
    if (genId === 'r1-sentence-colour' && q.answer !== shown.match(/is (\w+)\./)[1]) problems.push('sentence colour wrong');
    if (genId === 'r1-sentence-count' && Number(q.answer) !== NUMW.indexOf(shown.match(/see (\w+) /)[1]) + 1) problems.push('sentence count wrong');
    if (genId === 'r1-sentence-yes-no') { const m2 = q.explainVisual.text.match(/is (\w+)\./); if (q.answer !== (m2[1] === q.visual.colour ? 'Yes' : 'No')) problems.push('sentence yes/no wrong'); }
    if (genId === 'r1-who' && q.answer !== q.story.match(/^(\w+) has/)[1]) problems.push('who wrong');
    if (genId === 'r1-where' && q.answer !== q.story.match(/ran to (the \w+)\./)[1]) problems.push('where wrong');
    if (genId === 'r1-what-colour' && q.answer !== q.story.match(/got a (\w+) /)[1]) problems.push('what colour wrong');
    if (genId === 'r1-how-many' && Number(q.answer) !== NUMW.indexOf(q.story.match(/has (\w+) /)[1]) + 1) problems.push('how many wrong');
    if (genId === 'r1-true-false') { const real = q.story.match(/ran to (the \w+)\./)[1]; const claim = q.prompt.match(/run to (the \w+)\?/)[1]; /* the question reads: In the story, did the dog run to the hill? (pass IB) */ if (q.answer !== (real === claim ? 'Yes' : 'No')) problems.push('true/false wrong'); }
    // Grade 2, re-derived from the numbers in the words
    const g2 = text.match(/\d+/g) ? text.match(/\d+/g).map(Number) : [];
    const HOURS = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'];
    const COINV = { penny: 1, nickel: 5, dime: 10, quarter: 25 };
    if (genId === 'g2-place-value' && Number(q.answer) !== g2[0] * 100 + g2[1] * 10 + g2[2]) problems.push('place value wrong');
    if (genId === 'g2-expanded') { const parts = q.answer.split(' + ').map(Number); if (parts.reduce((x, y) => x + y, 0) !== g2[0] || parts.length !== 3) problems.push('expanded form wrong'); }
    if (genId === 'g2-digit-means') { const n = g2[0]; const place = text.match(/the (\w+) digit/)[1]; /* pass IE: the place is named in the question */ const want = place === 'hundreds' ? Math.floor(n / 100) * 100 : place === 'tens' ? Math.floor((n % 100) / 10) * 10 : n % 10; if (Number(q.answer) !== want) problems.push('digit value wrong'); }
    if (genId === 'g2-build-3digit') { const [h, t, o] = q.answer.match(/\d+/g).map(Number); if (h * 100 + t * 10 + o !== g2[0]) problems.push('build 3-digit wrong'); }
    if (genId === 'g2-hundred-more') { const more = /more/.test(q.prompt); if (Number(q.answer) !== (more ? g2[1] + 100 : g2[1] - 100)) problems.push('hundred more/less wrong'); }
    if ((genId === 'g2-add' || genId === 'g2-add-story') && Number(q.answer) !== g2[0] + g2[1]) problems.push('grade 2 add wrong');
    if (genId === 'g2-add-carry-ones') { const [a, b] = g2; const o = (a % 10) + (b % 10); if (q.answer !== `Write ${o % 10}, carry 1 ten` || o < 10) problems.push('carry wrong'); }
    if (genId === 'g2-add-missing' && g2[0] + Number(q.answer) !== g2[1]) problems.push('grade 2 missing addend wrong');
    if (genId === 'g2-add-three' && Number(q.answer) !== g2[0] + g2[1] + g2[2]) problems.push('add three wrong');
    if ((genId === 'g2-sub' || genId === 'g2-sub-story' || genId === 'g2-sub-compare') && Number(q.answer) !== g2[0] - g2[1]) problems.push('grade 2 subtract wrong');
    if (genId === 'g2-sub-borrow-ones') { const [a] = g2; const t = Math.floor(a / 10); const o = a % 10; if (q.answer !== `${t - 1} tens and ${o + 10} ones`) problems.push('borrow wrong'); }
    if (genId === 'g2-sub-check') { const [a, b] = g2; if (q.answer !== `${a - b} + ${b} = ${a}`) problems.push('sub check wrong'); }
    if (genId === 'g2-read-clock' && q.answer !== `${HOURS[q.visual.hour % 12]} o'clock`) problems.push('read clock wrong');
    if (genId === 'g2-half-past' && q.answer !== `half past ${HOURS[q.visual.hour % 12]}`) problems.push('half past wrong');
    if (genId === 'g2-which-clock') { const half = /half past/.test(q.prompt); const word = half ? q.prompt.match(/half past (\w+)/)[1] : q.prompt.match(/shows (\w+) o'clock/)[1]; const h = HOURS.indexOf(word) === 0 ? 12 : HOURS.indexOf(word); if (q.answer !== `clock:${h}:${half ? 30 : 0}`) problems.push('which clock wrong'); }
    if (genId === 'g2-minutes-in') { const want = /half an hour/.test(q.prompt) ? 30 : /two hours/.test(q.prompt) ? 120 : 60; if (Number(q.answer) !== want) problems.push('minutes wrong'); }
    if (genId === 'g2-hour-later') { const h = q.visual.hour; const later = g2[0]; const h2 = ((h + later - 1) % 12) + 1; if (q.answer !== `${HOURS[h2 % 12]} o'clock`) problems.push('hour later wrong'); }
    if (genId === 'g2-coin-value' && Number(q.answer) !== COINV[q.prompt.match(/is a (\w+)/)[1]]) problems.push('coin value wrong');
    if (genId === 'g2-count-coins') { const names = q.story.match(/\ba (penny|nickel|dime|quarter)/gi).map((x) => x.slice(2).toLowerCase()); if (Number(q.answer) !== names.reduce((sum, n) => sum + COINV[n], 0)) problems.push('count coins wrong'); }
    if (genId === 'g2-make-amount') { const names = q.answer.match(/a (\w+)/g).map((x) => x.slice(2)); if (names.reduce((sum, n) => sum + COINV[n], 0) !== g2[0]) problems.push('make amount wrong'); }
    if (genId === 'g2-change' && Number(q.answer) !== 100 - g2[0]) problems.push('change wrong');
    if (genId === 'g2-which-more-money') { const val = (c) => { const [n, coin] = c.split(' '); return Number(n) * COINV[coin.replace(/ies$/, 'y').replace(/s$/, '')]; /* pass IE: pennies */ }; if (val(q.answer) !== Math.max(...q.choices.map(val))) problems.push('more money wrong'); }
    if (genId === 'g2-array-total' && Number(q.answer) !== q.visual.rows * q.visual.cols) problems.push('array total wrong');
    if (genId === 'g2-repeated-add') { const terms = q.answer.split(' + ').map(Number); if (terms.length !== q.visual.rows || !terms.every((t) => t === q.visual.cols)) problems.push('repeated add wrong'); }
    if (genId === 'g2-rows-in' && Number(q.answer) !== q.visual.rows) problems.push('rows wrong');
    if (genId === 'g2-which-array' && q.answer !== `array:${g2[0]}x${g2[1]}`) problems.push('which array wrong');
    if (genId === 'g2-even-odd' && q.answer !== (g2[0] % 2 === 0 ? 'Even' : 'Odd')) problems.push('even/odd wrong');
    // Grade 2 reading, re-derived from word lists the generator does not share
    const TEAM = { rain: ['ai', 'A'], pail: ['ai', 'A'], wait: ['ai', 'A'], boat: ['oa', 'O'], road: ['oa', 'O'], soap: ['oa', 'O'], feet: ['ee', 'E'], seed: ['ee', 'E'], keep: ['ee', 'E'], meat: ['ea', 'E'], leaf: ['ea', 'E'], bead: ['ea', 'E'] };
    const SPLIT = { rabbit: 'rab bit', basket: 'bas ket', napkin: 'nap kin', picnic: 'pic nic', magnet: 'mag net', sunset: 'sun set', muffin: 'muf fin', cactus: 'cac tus' };
    const SYL2 = { banana: 3, elephant: 3, umbrella: 3, butterfly: 3 };
    if (genId === 'r2-team-sound' && q.answer !== TEAM[shown][1]) problems.push('team sound wrong');
    if (genId === 'r2-which-team' && q.answer !== TEAM[shown][0]) problems.push('which team wrong');
    if (genId === 'r2-team-word' && TEAM[q.answer][1] !== q.prompt.match(/long (\w) sound/)[1]) problems.push('team word wrong');
    if (genId === 'r2-same-team' && TEAM[q.answer][0] !== TEAM[shown][0]) problems.push('same team wrong');
    if (genId === 'r2-odd-team') { const ts = q.choices.map((c) => TEAM[c][0]); const odd = q.choices.find((c) => ts.filter((t) => t === TEAM[c][0]).length === 1); if (q.answer !== odd) problems.push('odd team wrong'); }
    if (genId === 'r2-split-word' && q.answer !== SPLIT[shown]) problems.push('split wrong');
    if (genId === 'r2-join-parts' && SPLIT[q.answer] !== shown) problems.push('join parts wrong');
    if (genId === 'r2-compound') { const [a, b] = shown.split(' + '); if (q.answer !== a + b) problems.push('compound wrong'); }
    if (genId === 'r2-compound-parts') { const [a, b] = q.answer.split(' and '); if (a + b !== shown) problems.push('compound parts wrong'); }
    if (genId === 'r2-count-parts') { const want = SYL2[shown] || (SPLIT[shown] ? 2 : 1); if (Number(q.answer) !== want) problems.push('count parts wrong'); }
    if (genId === 'r2-why' && q.answer !== `Because ${q.story.match(/because (.+?)\. At/)[1]}`) problems.push('why wrong');
    if (genId === 'r2-first' && q.answer !== q.story.split('. ')[0]) problems.push('first wrong');
    if (genId === 'r2-last' && q.answer !== q.story.match(/At the end (.+)\.$/)[1]) problems.push('last wrong');
    if (genId === 'r2-who-did' && q.answer !== q.story.split(' ')[0]) problems.push('who did wrong');
    if (genId === 'r2-how-felt' && q.answer !== q.story.match(/felt (\w+)/)[1]) problems.push('how felt wrong');
    if (genId === 'r2-context') { const CTX = { famished: 'very hungry', enormous: 'very big', timid: 'shy and easily scared', gleaming: 'shining brightly', drowsy: 'sleepy', ancient: 'very old', vanished: 'disappeared', fragile: 'easily broken' }; if (q.answer !== CTX[shown]) problems.push('context meaning wrong'); }
    if (genId === 'r2-opposite') { const OPP = { big: 'small', small: 'big', hot: 'cold', cold: 'hot', fast: 'slow', slow: 'fast', happy: 'sad', sad: 'happy', wet: 'dry', dry: 'wet', loud: 'quiet', quiet: 'loud', full: 'empty', empty: 'full', old: 'new', new: 'old' }; if (q.answer !== OPP[shown]) problems.push('opposite wrong'); }
    if (genId === 'r2-best-fit') { const SENT = { famished: 'ate three bowls', enormous: 'could not fit', timid: 'hid under the bed', gleaming: 'sparkled', drowsy: 'yawned', ancient: 'since before the town', vanished: 'could not be seen', fragile: 'does not break' }; if (!q.story.includes(SENT[q.answer])) problems.push('best fit wrong'); }
    // Grade 3 reading, re-derived from the passage parts
    const AFFIX = { un: 'not', re: 'again', pre: 'before', dis: 'the opposite of', mis: 'wrongly', ful: 'full of', less: 'without', er: 'a person who', ly: 'in that way' };
    const OPS = ['Spiders are scary.', 'Winter is the best season.', 'Vegetables taste awful.', 'Blue is the prettiest color.', 'Math is boring.', 'Cats are better than dogs.', 'Rainy days are the worst.', 'Football is the most fun sport.'];
    if (genId === 'r3-main-idea' && !q.story.startsWith(q.answer)) problems.push('main idea is not the opening sentence');
    if (genId === 'r3-detail' && (!q.story.includes(q.answer) || q.story.startsWith(q.answer))) problems.push('detail is not a later sentence of the passage');
    if (genId === 'r3-not-in-passage' && q.story.includes(q.answer)) problems.push('not-in-passage sentence is in the passage');
    if (genId === 'r3-best-title') { /* the title matches the topic, checked by the passage list itself */ }
    if (genId === 'r3-prefix-meaning' && q.answer !== AFFIX[q.prompt.match(/prefix (\w+)/)[1]]) problems.push('prefix meaning wrong');
    if (genId === 'r3-suffix-meaning' && q.answer !== AFFIX[q.prompt.match(/suffix (\w+)/)[1]]) problems.push('suffix meaning wrong');
    if (genId === 'r3-build-word') { const [affix, base] = [q.story.match(/Add (\w+) to/)[1], q.story.match(/to (\w+)\./)[1]]; if (q.answer !== affix + base && q.answer !== base + affix && q.answer !== base.replace(/e$/, '') + affix) problems.push('built word wrong'); }
    if (genId === 'r3-which-affix') { const word = q.story.match(/Look at (\w+)\./)[1]; if (!word.startsWith(q.answer) && !word.endsWith(q.answer)) problems.push('affix not in word'); }
    if (genId === 'r3-take-affix') { const [affix, word] = [q.story.match(/Take (\w+) off/)[1], q.story.match(/off (\w+)\./)[1]]; if (word !== affix + q.answer && word !== q.answer + affix && word !== q.answer.replace(/e$/, '') + affix) problems.push('take affix wrong'); }
    if (genId === 'r3-fact-opinion' && q.answer !== (OPS.includes(q.story) ? 'Opinion' : 'Fact')) problems.push('fact/opinion wrong');
    if (genId === 'r3-which-is-fact' && OPS.includes(q.answer)) problems.push('picked an opinion as a fact');
    if (genId === 'r3-which-is-opinion' && !OPS.includes(q.answer)) problems.push('picked a fact as an opinion');
    if (genId === 'r3-clue-word' && !q.story.toLowerCase().includes(q.answer)) problems.push('clue word not in sentence');
    if (genId === 'r3-cause' && !q.story.toLowerCase().startsWith(q.answer.toLowerCase())) problems.push('cause wrong');
    if (genId === 'r3-effect' && !q.story.endsWith(q.answer + '.')) problems.push('effect wrong');
    if (genId === 'r3-order') { const steps = q.story.match(/(?:First|Next|Then|Finally), ([^.]+)\./g).map((x) => x.replace(/^\w+, /, '').replace(/\.$/, '')); const before = q.prompt.match(/after you (.+)\?/)[1]; if (steps[steps.indexOf(before) + 1] !== q.answer) problems.push('order wrong'); }
    if (genId === 'r3-signal-word') { const w = q.visual.text; const cause = ['because', 'so', 'since', 'as a result'].includes(w); if (q.answer !== (cause ? 'A cause or effect' : 'The order of events')) problems.push('signal word wrong'); }
    if (genId === 'r3-what-next') { const steps = q.story.match(/(?:First|Next|Then), ([^.]+)\./g).map((x) => x.replace(/^\w+, /, '').replace(/\.$/, '')); if (steps.includes(q.answer)) problems.push('what-next repeats a given step'); }
    // Grade 4, re-derived from the numbers in the words
    const g4 = text.match(/\d+/g) ? text.match(/\d+/g).map(Number) : [];
    const isPrimeN = (n) => n > 1 && Array.from({ length: n - 2 }, (_, i) => i + 2).every((d) => n % d !== 0);
    if ((genId === 'g4-two-by-one' || genId === 'g4-two-by-two' || genId === 'g4-multiply-story') && Number(q.answer) !== g4[0] * g4[1]) problems.push('grade 4 multiply wrong');
    if (genId === 'g4-split-first') { const [a, b] = g4; if (q.answer !== `${Math.floor(a / 10) * 10} × ${b} and ${a % 10} × ${b}`) problems.push('split wrong'); }
    if (genId === 'g4-estimate-product') { const [a, b] = g4; if (Number(q.answer) !== Math.round(a / 10) * 10 * b) problems.push('estimate wrong'); }
    if ((genId === 'g4-divide-exact' || genId === 'g4-divide-story') && Number(q.answer) * g4[1] !== g4[0]) problems.push('grade 4 divide wrong');
    if (genId === 'g4-divide-remainder') { const [n, b] = g4; const [qq, r] = q.answer.match(/\d+/g).map(Number); if (qq * b + r !== n || r >= b) problems.push('remainder division wrong'); }
    if (genId === 'g4-check-division') { const [n, b, qq, r] = g4; if (q.answer !== `${qq} × ${b} + ${r} = ${n}` || qq * b + r !== n) problems.push('division check wrong'); }
    if (genId === 'g4-remainder-only') { const [n, b] = g4; if (Number(q.answer) !== n % b) problems.push('remainder wrong'); }
    if (genId === 'g4-is-factor') { const [f, n] = g4; if (q.answer !== (n % f === 0 ? 'Yes' : 'No')) problems.push('is-factor wrong'); }
    if (genId === 'g4-list-factor' && g4[0] % Number(q.answer) !== 0) problems.push('listed factor does not divide');
    if (genId === 'g4-multiple' && Number(q.answer) % g4[0] !== 0) problems.push('multiple wrong');
    if (genId === 'g4-prime' && q.answer !== (isPrimeN(g4[0]) ? 'Yes' : 'No')) problems.push('prime wrong');
    if (genId === 'g4-next-multiple') { const [a, b, base] = g4; if (Number(q.answer) !== b + base || b - a !== base) problems.push('next multiple wrong'); }
    if (genId === 'g4-fraction-to-decimal') { const [top, bottom] = g4; if (Math.abs(Number(q.answer) - top / bottom) > 1e-9) problems.push('fraction to decimal wrong'); }
    if (genId === 'g4-decimal-to-fraction') { const dec = Number(q.prompt.match(/Write ([\d.]+) as/)[1]); const [top, bottom] = q.answer.split('/').map(Number); if (Math.abs(top / bottom - dec) > 1e-9) problems.push('decimal to fraction wrong'); }
    if (genId === 'g4-compare-decimals' && Number(q.answer) !== Math.max(...q.choices.map(Number))) problems.push('compare decimals wrong');
    if (genId === 'g4-tenths-hundredths' && Number(q.answer) !== g4[0] * 10) problems.push('tenths to hundredths wrong');
    if (genId === 'g4-decimal-picture' && Math.abs(Number(q.answer) - q.visual.shaded / 10) > 1e-9) problems.push('decimal picture wrong');
    if (genId === 'g4-add-fraction') { const [a, d, b] = g4; if (q.answer !== `${a + b}/${d}`) problems.push('add fraction wrong'); }
    if (genId === 'g4-sub-fraction') { const [a, d, b] = g4; if (q.answer !== `${a - b}/${d}`) problems.push('sub fraction wrong'); }
    if (genId === 'g4-mixed-number') { const [top, d] = g4; const [w, p, dd] = q.answer.match(/\d+/g).map(Number); if (w * d + p !== top || dd !== d) problems.push('mixed number wrong'); }
    if (genId === 'g4-fraction-story') { const [d, a, b] = g4; if (q.answer !== `${a + b}/${d}`) problems.push('fraction story wrong'); }
    if (genId === 'g4-simplify') { const [top, bottom] = g4; const [t2, b2] = q.answer.split('/').map(Number); if (Math.abs(t2 / b2 - top / bottom) > 1e-9 || t2 >= top) problems.push('simplify wrong'); }
    if (genId === 'bf-add-same-bottom') { const [a, p, b] = nums.flatMap((f) => f.split('/').map(Number)).filter((_, i) => i !== 3); if (q.answer !== `${a + b}/${p}`) problems.push('same-bottom sum wrong'); }
    // Letter sounds and rhymes, re-derived from the words themselves
    const RHYME_END = (w) => w.slice(-2);
    if (genId === 'rs-word-starts' && q.answer !== q.story.replace(/\.$/, '').toLowerCase()[0].toUpperCase()) problems.push('first sound letter wrong');
    if (genId === 'pl-tap-letter' && q.answer !== q.prompt.match(/letter (\w)/)[1]) problems.push('pre-K tap letter wrong');
    // Grade 5 math, re-derived from the prompt
    if (genId === 'g5-add-decimals') { const [a, b] = q.prompt.match(/[\d.]+/g).map(Number); if (Math.abs(a + b - Number(q.answer)) > 0.001) problems.push('decimal sum wrong'); }
    if (genId === 'g5-subtract-decimals') { const [a, b] = q.prompt.match(/[\d.]+/g).map(Number); if (Math.abs(a - b - Number(q.answer)) > 0.001) problems.push('decimal difference wrong'); }
    if (genId === 'g5-decimal-money') { const [a, b] = q.story.match(/[\d.]+/g).map(Number); if (Math.abs(a + b - Number(q.answer.replace('$', ''))) > 0.001) problems.push('money sum wrong'); }
    if (genId === 'g5-multiply-fractions') { const [a, b, c, d] = q.prompt.match(/\d+/g).map(Number); const [t, m] = q.answer.split('/').map(Number); if (a * c * m !== b * d * t) problems.push('fraction product wrong'); }
    if (genId === 'g5-fraction-of-whole') { const [n, c, d] = q.prompt.match(/\d+/g).map(Number); const parts = q.answer.split('/').map(Number); const val = parts.length === 2 ? parts[0] / parts[1] : parts[0]; if (Math.abs(val - n * c / d) > 0.0001) problems.push('fraction of whole wrong'); }
    if (genId === 'g5-divide-2digit') { const [n, d] = q.prompt.match(/\d+/g).map(Number); if (n / d !== Number(q.answer)) problems.push('two-digit quotient wrong'); }
    if (genId === 'g5-divide-check') { const [n, d, qn] = q.story.match(/\d+/g).map(Number); if (!q.answer.startsWith(`${d} x ${qn} = ${n}`)) problems.push('division check wrong'); }
    if (genId === 'g5-divide-remainder') { const [n, d] = q.prompt.match(/\d+/g).map(Number); const [qn, r] = q.answer.match(/\d+/g).map(Number); if (qn * d + r !== n || r >= d) problems.push('remainder wrong'); }
    if (genId === 'g5-volume') { const [l, w, h] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) !== l * w * h) problems.push('volume wrong'); }
    if (genId === 'g5-missing-side') { const [v, l, w] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) * l * w !== v) problems.push('missing side wrong'); }
    if (genId === 'g5-volume-layers') { const [layer, h] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) !== layer * h) problems.push('layers wrong'); }
    if (genId === 'g5-order-ops') { const [a, b, c] = q.prompt.match(/\d+/g).map(Number); if (Number(q.answer) !== a + b * c) problems.push('order of operations wrong'); }
    if (genId === 'g5-brackets') { const [a, b, c] = q.prompt.match(/\d+/g).map(Number); if (Number(q.answer) !== (a + b) * c) problems.push('brackets wrong'); }
    // College math, re-derived from the prompt
    if (genId === 'gc-mean') { const vals = q.story.split(', ').map(Number); if (Math.abs(Number(q.answer) - vals.reduce((a, b) => a + b, 0) / vals.length) > 0.06) problems.push('mean wrong'); }
    if (genId === 'gc-median') { const vals = q.story.split(', ').map(Number).sort((a, b) => a - b); if (Number(q.answer) !== vals[Math.floor(vals.length / 2)]) problems.push('median wrong'); }
    if (genId === 'gc-mode') { const vals = q.story.split(', ').map(Number); const counts = {}; vals.forEach((v) => { counts[v] = (counts[v] || 0) + 1; }); const best = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]; if (q.answer !== best) problems.push('mode wrong'); }
    if (genId === 'gc-range') { const vals = q.story.split(', ').map(Number); if (Number(q.answer) !== Math.max(...vals) - Math.min(...vals)) problems.push('range wrong'); }
    if (genId === 'gc-more-spread') { const [a, b] = q.story.split('\n').map((line) => line.replace(/^Set [AB]: /, '').split(', ').map(Number)); const ra = Math.max(...a) - Math.min(...a); const rb = Math.max(...b) - Math.min(...b); if (q.answer !== (ra > rb ? 'Set A' : 'Set B')) problems.push('spread wrong'); }
    if (genId === 'gc-simple-probability') { const [red, blue] = q.story.match(/\d+/g).map(Number); const [t, m] = q.answer.split('/').map(Number); if (t * (red + blue) !== red * m) problems.push('probability wrong'); }
    if (genId === 'gc-not-probability') { const [red, blue] = q.story.match(/\d+/g).map(Number); const [t, m] = q.answer.split('/').map(Number); if (t * (red + blue) !== blue * m) problems.push('not probability wrong'); }
    if (genId === 'gc-two-independent') { const [a, b] = q.story.match(/1\/(\d+)/g).map((x) => Number(x.slice(2))); if (q.answer !== `1/${a * b}`) problems.push('two independent wrong'); }
    if (genId === 'gc-compound-amount') { const [principal, rate] = q.story.replace(/,/g, '').match(/\d+/g).map(Number); const years = Number(q.prompt.match(/\d+/)[0]); if (Number(q.answer.replace(/,/g, '').match(/\d+/)[0]) !== Math.round(principal * (1 + rate / 100) ** years)) problems.push('compound amount wrong'); }
    if (genId === 'gc-simple-vs-compound') { const [principal, rate, years] = q.story.replace(/,/g, '').match(/\d+/g).map(Number); const diff = Math.round(principal * (1 + rate / 100) ** years) - (principal + principal * rate / 100 * years); if (Number(q.answer.replace(/,/g, '').match(/\d+/)[0]) !== diff) problems.push('simple vs compound wrong'); }
    if (genId === 'gc-years-to-grow') { const target = Number(q.prompt.match(/\d+/)[0]); if (Number(q.answer.match(/\d+/)[0]) !== Math.log2(target) * 10) problems.push('years to grow wrong'); }
    // History: a dated fact is always followed by its story, so a wrong answer teaches something.
    if (/^h\d+-/.test(genId) && ['When?', 'In what year?', 'What happened that year?', 'What happened then?', 'What was it, and when?'].includes(q.prompt) && !q.explain.includes('\n')) problems.push('dated fact has no story');
    // History, re-derived from the fixed facts
    if (/^h1[01]-.*-year$/.test(genId) || genId === 'h10-rome-year' || genId === 'h10-medieval-year' || genId === 'h10-rev-year' || genId === 'h10-war-year') { const years = { 'Rome becomes a republic': '509 BC', 'Caesar crosses the Rubicon': '49 BC', 'Caesar is killed': '44 BC', 'Augustus becomes the first emperor': '27 BC', 'Rome falls in the west': '476 AD', 'The Black Death arrives in Europe': '1347', 'The Renaissance begins in Italy': 'about 1400', 'Gutenberg\'s printing press': 'about 1450', 'Rome falls in the west and feudal Europe begins': '476', 'The American Revolution declares independence': '1776', 'The French Revolution begins': '1789', 'France executes its king': '1793', 'Napoleon becomes emperor': '1804', 'The First World War begins': '1914', 'The First World War ends': '1918', 'Hitler comes to power in Germany': '1933', 'Germany invades Poland and the Second World War begins': '1939', 'Pearl Harbor brings the United States in': '1941', 'The Second World War ends': '1945', 'The transcontinental railroad is finished': '1869', 'Food and drug safety laws pass': '1906', 'Standard Oil is broken up': '1911', 'The income tax and direct election of senators': '1913', 'The 19th Amendment: women win the vote': '1920', 'The stock market crashes': '1929', 'A quarter of workers are unemployed and the New Deal begins': '1933', 'Social Security is created': '1935', 'Pearl Harbor, December 7': '1941', 'D-Day, June 6': '1944', 'Germany surrenders in May and Japan in August': '1945', 'The country apologizes for the internment of Japanese Americans': '1988', 'Sputnik': '1957', 'The Cuban Missile Crisis': '1962', 'Americans land on the moon': '1969', 'The Berlin Wall falls': '1989', 'The Soviet Union dissolves': '1991', 'Brown v. Board of Education': '1954', 'The Montgomery bus boycott': '1955', 'The March on Washington': '1963', 'The Civil Rights Act': '1964', 'The Voting Rights Act': '1965', 'Dr. King is assassinated': '1968', 'The September 11 attacks': '2001', 'The war in Iraq begins': '2003', 'The financial crisis': '2008', 'Barack Obama becomes the first Black president': '2009', 'The pandemic closes schools and businesses': '2020' }; const key = q.story.replace(/\.$/, ''); if (years[key] !== undefined && q.answer !== years[key]) problems.push('year wrong'); }
    if (['h4-tx-year', 'h4-rev-year', 'h4-union-year', 'h8-republic-year', 'h8-crisis-year'].includes(genId)) { const years = { 'San Antonio is founded': 1718, 'Mexico wins independence from Spain': 1821, 'Texas declares independence': 1836, 'Texas becomes the 28th state': 1845, 'The Alamo falls after a thirteen-day siege': 1836, 'Texans win at San Jacinto in eighteen minutes': 1836, 'Texans rise against Mexico': 1835, 'The Republic of Texas joins the United States': 1845, 'Texas becomes a state': 1845, 'Texas joins the Confederacy': 1861, 'Juneteenth: slavery ends in Texas': 1865, 'Oil at Spindletop': 1901, 'Washington takes office': 1789, 'Jefferson buys Louisiana': 1803, 'A second war with Britain begins': 1812, 'The Monroe Doctrine': 1823, 'Andrew Jackson is elected': 1828, 'The Missouri Compromise': 1820, 'The Compromise of 1850': 1850, 'The Kansas-Nebraska Act': 1854, 'The Dred Scott decision': 1857, 'Lincoln is elected': 1860 }; if (Number(q.answer) !== years[q.story.replace(/\.$/, '')]) problems.push('year wrong'); }
    if (genId === 'h8-amendment-year') { const y = { '13th': 1865, '14th': 1868, '15th': 1870 }[q.story.match(/(1[345]th)/)[1]]; if (Number(q.answer) !== y) problems.push('amendment year wrong'); }
    if (genId === 'h5-event-year' || genId === 'h5-west-year' || genId === 'h5-war-year') { const years = { 'The Stamp Act taxes paper': 1765, 'British soldiers fire on a crowd in Boston': 1770, 'Colonists dump tea into Boston Harbor': 1773, 'Shots at Lexington and Concord': 1775, 'The Declaration of Independence': 1776, 'The Louisiana Purchase doubles the country': 1803, 'Lewis and Clark set out for the Pacific': 1804, 'Gold is found in California': 1848, 'The country stretches from ocean to ocean': 1850, 'The war begins at Fort Sumter': 1861, 'The Emancipation Proclamation and Gettysburg': 1863, 'The Confederacy surrenders and the 13th Amendment ends slavery': 1865 }; if (Number(q.answer) !== years[q.story.replace(/\.$/, '')]) problems.push('year wrong'); }
    // Grade 12 government and economics, re-derived from the story
    if (genId === 'g12-two-thirds') { const n = Number(q.story.match(/\d+/)[0]); if (Number(q.answer) !== Math.ceil(2 * n / 3)) problems.push('two thirds wrong'); }
    if (genId === 'g12-override-votes') { const [total, yes] = q.story.match(/\d+/g).map(Number); if (q.answer !== (yes >= Math.ceil(2 * total / 3) ? 'Yes' : 'No')) problems.push('override wrong'); }
    if (genId === 'g12-electors') { const reps = Number(q.story.match(/has (\d+)/)[1]); if (Number(q.answer) !== reps + 2) problems.push('electors wrong'); }
    if (genId === 'g12-presidential-year') { const y = Number(q.story.match(/\d+/)[0]); if (q.answer !== (y % 4 === 0 ? 'Presidential' : 'Midterm')) problems.push('election year wrong'); }
    if (genId === 'g12-how-many') { const table = { 'members of the House of Representatives': 435, senators: 100, 'senators from each state': 2, 'justices on the Supreme Court': 9, "years in a President's term": 4, "years in a senator's term": 6, "years in a representative's term": 2, 'terms a President may serve': 2 }; const asked = { 'How many members does the House of Representatives have?': 435, 'How many senators are there?': 100, 'How many senators does each state have?': 2, 'How many justices sit on the Supreme Court?': 9, "How many years are in a President's term?": 4, "How many years are in a senator's term?": 6, "How many years are in a representative's term?": 2, 'How many terms may a President serve?': 2 }; const what = q.prompt.replace(/^How many /, '').replace(/\?$/, ''); if (Number(q.answer) !== (asked[q.prompt] ?? table[what])) problems.push('count wrong'); }
    if (genId === 'e12-opportunity-cost') { const nums = q.story.match(/\d+/g).map(Number); if (Number(q.answer) !== (nums.length > 1 ? Math.min(...nums) : nums[0])) problems.push('opportunity cost wrong'); }
    if (genId === 'e12-equilibrium-price') { const line = q.story.split('\n').find((l) => { const [, d, s] = l.match(/want (\d+) and sellers offer (\d+)/); return d === s; }); if (Number(q.answer) !== Number(line.match(/At (\d+)/)[1])) problems.push('equilibrium wrong'); }
    if (genId === 'e12-shortage-or-surplus') { const [a, b] = q.story.match(/\d+/g).map(Number); if (q.answer !== (a > b ? 'Shortage' : 'Surplus')) problems.push('shortage wrong'); }
    if (genId === 'e12-revenue') { const [qty, price] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) !== qty * price) problems.push('revenue wrong'); }
    if (genId === 'e12-profit') { const [r, c] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) !== r - c) problems.push('profit wrong'); }
    if (genId === 'e12-simple-interest') { const [p, r] = q.story.match(/\d+/g).map(Number); const y = Number(q.prompt.match(/\d+/)[0]); if (Number(q.answer) !== p * r * y / 100) problems.push('simple interest wrong'); }
    if (genId === 'e12-growth-rate') { const [last, now] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) !== (now - last) / last * 100) problems.push('growth wrong'); }
    if (genId === 'e12-price-after-inflation') { const [r, old] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) !== old * (100 + r) / 100) problems.push('inflation wrong'); }
    if (genId === 'e12-unemployment-rate') { const [w, u] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) !== u / (w + u) * 100) problems.push('unemployment wrong'); }
    if (genId === 'e12-budget-left') { const [i, r, f, o] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) !== i - r - f - o || i - r - f - o <= 0) problems.push('budget wrong'); }
    if (genId === 'e12-percent-of-income') { const [i, pct] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) !== i * pct / 100) problems.push('percent of income wrong'); }
    if (genId === 'e12-rule-of-72') { const rate = Number(q.story.match(/\d+/)[0]); if (Number(q.answer) !== 72 / rate) problems.push('rule of 72 wrong'); }
    if (genId === 'e12-card-interest') { const [apr, bal] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) !== bal * apr / 1200) problems.push('card interest wrong'); }
    // College history and grade 2 maps, re-derived from the story
    if (genId === 'hc-which-century') { const y = Number(q.story.match(/\d+/)[0]); if (Number(q.answer) !== Math.floor((y - 1) / 100) + 1) problems.push('century wrong'); }
    if (genId === 'hc-years-between') { const [a, b] = q.story.match(/\d+/g).map(Number); const bc = /BC/.test(q.story); if (Number(q.answer) !== (bc ? a + b - 1 : b - a)) problems.push('years between wrong'); }
    if (genId === 'hc-earlier') { const [a, b] = q.story.match(/\d+/g).map(Number); if (q.answer !== `${Math.max(a, b)} BC`) problems.push('earlier wrong'); }
    if (genId === 'hc-which-decade') { const y = Number(q.story.match(/\d+/)[0]); if (Number(q.answer) !== Math.floor(y / 10) * 10) problems.push('decade wrong'); }
    if (genId === 'c2-blocks-walked') { const [a, b] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) !== a + b) problems.push('blocks wrong'); }
    if (genId === 'ck-more-votes') { const [a, b] = q.choices.map((c) => Number(c.split(':')[1])); if (q.answer !== `dots:${Math.max(a, b)}` || a === b) problems.push('more votes wrong'); }
    if (genId === 'c2-weeks-to-save') { const [price, per] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) !== price / per) problems.push('weeks to save wrong'); }
    // Kindergarten to grade 3 civics, re-derived from the story
    if (genId === 'c2-vote-winner') { const [a, b] = q.story.match(/\d+/g).map(Number); if (q.answer !== (a > b ? 'Pizza' : 'Tacos')) problems.push('vote winner wrong'); }
    if (genId === 'c2-vote-margin' || genId === 'c3-vote-margin') { const [a, b] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) !== Math.abs(a - b)) problems.push('vote margin wrong'); }
    if (genId === 'c2-money-left' || genId === 'c3-money-left') { const [have, spend] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) !== have - spend) problems.push('money left wrong'); }
    if (genId === 'c3-can-afford') { const [have, a, b] = q.story.match(/\d+/g).map(Number); if (q.answer !== (a + b <= have ? 'Yes' : 'No')) problems.push('afford wrong'); }
    if (genId === 'c3-vote-winner') { const nums = q.story.match(/\d+/g).map(Number); const total = nums[0]; const zoo = q.story.indexOf('zoo') < q.story.indexOf('museum') ? nums[1] : nums[2]; if (!(zoo > total / 2)) problems.push('zoo must hold the majority'); }
    if (genId === 'c2-earlier-year') { const [a, b] = q.choices.map(Number); if (Number(q.answer) !== Math.min(a, b)) problems.push('earlier year wrong'); }
    if (genId === 'c1-count-coins') { const n = ['Two', 'Three', 'Four', 'Five'].indexOf(q.story.split(' ')[0]) + 2; const cents = /dime/.test(q.story) ? 10 : /nickel/.test(q.story) ? 5 : 1; if (Number(q.answer) !== n * cents) problems.push('coins wrong'); }
    // Explanations read cleanly too: no sentence runs past 45 words, a run-on guard (pass JG) (the second run-on check).
    for (const sent of String(q.explain || '').replace(/\[\[|\]\]|\*\*/g, '').split(/(?<=[.!?])\s+|\n/)) { if (sent.trim().split(/\s+/).filter(Boolean).length > 45) problems.push(`explanation sentence over 32 words: ${sent.trim().slice(0, 40)}`); }
    // Science facts carry a story after the answer (the story rule, applied centrally)
    if (L.SCIENCE_WHY_GENERATORS.includes(genId) && !q.explain.includes('\n')) problems.push('science fact has no story');
    // Grades 6, 7 and 9 social studies, re-derived from the story
    if (genId === 'wc6-hemisphere') { const [, ns, ew] = q.story.match(/degrees ([NS]), \d+ degrees ([EW])/); if (q.answer !== `${ns === 'N' ? 'Northern' : 'Southern'} and ${ew === 'E' ? 'Eastern' : 'Western'}`) problems.push('hemisphere wrong'); }
    if (genId === 'wc6-gdp-per-person') { const [gdp, people] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) !== gdp * 1000 / people) problems.push('gdp per person wrong'); }
    if (genId === 'wc6-density' || genId === 'wg9-density') { const m = q.story.match(/([\d.]+) (million|thousand)? ?people on ([\d.]+)/); const people = Number(m[1]) * (m[2] === 'million' ? 1000 : 1); const area = Number(m[3]); if (Number(q.answer) !== people / area) problems.push('density wrong'); }
    if (genId === 'wc6-more-crowded') { const [a, b] = q.story.match(/\d+/g).map(Number); if (q.answer !== (a > b ? 'Town A' : 'Town B')) problems.push('crowded wrong'); }
    if (genId === 'tx7-herd-math') { const [head, price] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) !== head * price) problems.push('herd wrong'); }
    if (genId === 'wg9-lapse') { const [base, m] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) !== base - 6 * (m / 1000)) problems.push('lapse wrong'); }
    if (genId === 'wg9-map-scale') { const [, per, cm] = q.story.match(/1 centimeter stands for (\d+) kilometers. Two towns are (\d+)/).map(Number); if (Number(q.answer) !== per * cm) problems.push('scale wrong'); }
    if (genId === 'wg9-time-zones') { const [a, b] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) !== (b - a) / 15) problems.push('time zone wrong'); }
    if (genId === 'wg9-natural-increase') { const [births, deaths] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) !== births - deaths) problems.push('increase wrong'); }
    if (genId === 'wg9-urban-share') { const [total, urban] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) !== urban / total * 100) problems.push('urban share wrong'); }
    if (genId === 'wg9-trade-balance') { const [exp, imp] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) !== exp - imp) problems.push('trade balance wrong'); }
    // Science, re-derived from the fixed lists
    if (genId === 's6-density') { const [m, v] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) * v !== m) problems.push('density wrong'); }
    if (genId === 's6-float-or-sink') { const d = Number(q.story.match(/about ([\d.]+)/)[1]); if (q.answer !== (d < 1 ? 'Floats' : 'Sinks')) problems.push('float wrong'); }
    if (genId === 's7-tenth-rule') { const base = Number(q.story.replace(/,/g, '').match(/\d+/)[0]); if (Number(q.answer.replace(/,/g, '').match(/\d+/)[0]) * 10 !== base) problems.push('tenth rule wrong'); }
    if (genId === 's8-read-slope') { const [d, t] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) * t !== d) problems.push('slope read wrong'); }
    if (genId === 's8-which-older') { const [a, b] = q.story.match(/layer (\d+)/g).map((x) => Number(x.slice(6))); if (q.answer !== `The one in layer ${Math.max(a, b)}`) problems.push('older layer wrong'); }
    if (genId === 's11-momentum') { const [m, v] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) !== m * v) problems.push('momentum wrong'); }
    if (genId === 's11-after-collision') { const [m, v] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) !== v) problems.push('collision wrong'); }
    if (genId === 's11-same-momentum') { const [truck, v, ball] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/[\d.]+/)[0]) * ball !== truck * v) problems.push('same momentum wrong'); }
    if (genId === 's11-work') { const [f, d] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) !== f * d) problems.push('work wrong'); }
    if (genId === 's11-power') { const [w, t] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) * t !== w) problems.push('power wrong'); }
    if (genId === 's11-angle-out') { const a = Number(q.story.match(/\d+/)[0]); if (Number(q.answer.match(/\d+/)[0]) !== a) problems.push('angle wrong'); }
    if (genId === 's11-series-resistance') { const [a, b] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) !== a + b) problems.push('series resistance wrong'); }
    if (genId === 's12-layer-order') { const order = ['Crust', 'Mantle', 'Outer core', 'Inner core']; const i = order.findIndex((x) => q.prompt.toLowerCase().includes(`the ${x.toLowerCase()}?`)); if (i < 0 || q.answer !== order[i + 1]) problems.push('layer order wrong'); }
    if (genId === 's12-redshift' && q.answer !== 'Galaxy B') problems.push('redshift wrong');
    if (genId === 's9-chromosome-count') { const full = Number(q.story.match(/\d+/)[0]); const meiosis = /meiosis/.test(q.story); if (Number(q.answer) !== (meiosis ? full / 2 : full)) problems.push('chromosome count wrong'); }
    if (genId === 's9-codon-count') { const letters = Number(q.story.match(/\d+/)[0]); if (Number(q.answer) * 3 !== letters) problems.push('codon count wrong'); }
    if (genId === 's10-molar-mass') { const masses = { 'H₂O': 18, 'CO₂': 44, 'NaCl': 58.5, 'CH₄': 16, 'O₂': 32, 'NH₃': 17, 'MgO': 40 }; const f = q.story.split(',')[0]; if (Number(q.answer.match(/[\d.]+/)[0]) !== masses[f]) problems.push('molar mass wrong'); }
    if (genId === 's10-grams-in-moles') { const mass = Number(q.story.match(/of (\d+) grams/)[1]); const n = Number(q.prompt.match(/\d+/)[0]); if (Number(q.answer.match(/\d+/)[0]) !== mass * n) problems.push('grams wrong'); }
    if (genId === 's10-moles-from-grams') { const [mass, grams] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) * mass !== grams) problems.push('moles wrong'); }
    if (genId === 's10-boyle') { const [v1, one, v2] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) * v2 !== v1) problems.push('boyle wrong'); }
    if (genId === 's10-molarity') { const [moles, liters] = q.story.match(/[\d.]+/g).map(Number); if (Math.abs(Number(q.answer.match(/[\d.]+/)[0]) * liters - moles) > 0.001) problems.push('molarity wrong'); }
    if (genId === 's11-speed') { const [d, t] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) * t !== d) problems.push('speed wrong'); }
    if (genId === 's11-acceleration') { const [v0, v1, t] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) * t !== v1 - v0) problems.push('acceleration wrong'); }
    if (genId === 's11-potential') { const [m, h] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) !== m * 10 * h) problems.push('potential wrong'); }
    if (genId === 's11-kinetic') { const [m, v] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) !== m * v * v / 2) problems.push('kinetic wrong'); }
    if (genId === 's11-wave-speed') { const [wl, f] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) !== wl * f) problems.push('wave speed wrong'); }
    if (genId === 's11-wavelength-from') { const f = Number(q.story.match(/frequency of (\d+)/)[1]); if (Number(q.answer.match(/[\d.]+/)[0]) * f !== 340) problems.push('wavelength wrong'); }
    if (genId === 's11-current') { const [v, r] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) * r !== v) problems.push('current wrong'); }
    if (genId === 's11-resistance') { const [v, i] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) * i !== v) problems.push('resistance wrong'); }
    if (genId === 's11-voltage') { const [i, r] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) !== i * r) problems.push('voltage wrong'); }
    if (genId === 's9-pair-letter') { const L = q.story.match(/letter ([ATCG])/)[1]; const pair = { A: 'T', T: 'A', C: 'G', G: 'C' }; if (q.answer !== pair[L]) problems.push('base pair wrong'); }
    if (genId === 's9-complement') { const strand = q.story.replace('Strand: ', '').split(' '); const pair = { A: 'T', T: 'A', C: 'G', G: 'C' }; if (q.answer !== strand.map((x) => pair[x]).join(' ')) problems.push('complement wrong'); }
    if (genId === 's9-shows-trait') { const combo = q.story.match(/has (\w\w)\./)[1]; if ((combo === 'bb' ? 'Blue' : 'Brown') !== q.answer) problems.push('trait shown wrong'); }
    if (genId === 's9-closer-relative' && q.answer !== 'Species X') problems.push('closer relative wrong');
    if (genId === 's10-count-atoms') { const mm = q.story.match(/^(\d+)/); const mult = Number(mm[1]); const atom = q.prompt.match(/many (\w+) atoms/)[1]; const sub = { hydrogen: { '2H₂O': 2, '4NH₃': 3, '2CH₄': 4 }, oxygen: { '2H₂O': 1, '3CO₂': 2 }, carbon: { '3CO₂': 1 }, chlorine: { '2NaCl': 1 } }[atom][q.story]; if (Number(q.answer) !== mult * sub) problems.push('atom count wrong'); }
    if (genId === 's10-acid-or-base') { const ph = Number(q.story.match(/pH of about (\d+)/)[1]); if (q.answer !== (ph < 7 ? 'Acid' : ph === 7 ? 'Neutral' : 'Base')) problems.push('acid or base wrong'); }
    if (genId === 's10-how-many-times') { const [low, high] = q.story.match(/pH (\d+)/g).map((x) => Number(x.slice(3))); if (Number(q.answer.match(/\d+/)[0]) !== 10 ** (high - low)) problems.push('ten times wrong'); }
    if (genId === 's10-metal-or-not') { const el = (q.prompt.match(/^Is (\w+) a metal/) || [])[1]; const metals = ['iron', 'copper', 'sodium', 'gold', 'aluminum']; if (!el || (metals.includes(el) ? 'Metal' : 'Nonmetal') !== q.answer) problems.push('metal wrong'); }
    if (genId === 's8-f-equals-ma') { const [m, a] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) !== m * a) problems.push('force wrong'); }
    if (genId === 's8-mass-conserved') { const [a, b] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) !== a + b) problems.push('conservation wrong'); }
    if (genId === 's8-more-mass') { const [light] = q.story.match(/\d+/g).map(Number); if (q.answer !== `The ${light} kg ball`) problems.push('more mass wrong'); }
    if (genId === 's8-atomic-number') { const n = Number(q.story.match(/\d+/)[0]); const table = { 1: 'hydrogen', 2: 'helium', 6: 'carbon', 7: 'nitrogen', 8: 'oxygen', 10: 'neon' }; if (q.answer !== table[n]) problems.push('atomic number wrong'); }
    if (genId === 's8-biggest-of') { const order = ['the moon', 'the Earth', 'the solar system', 'the Milky Way', 'the universe']; const best = [...q.choices].sort((x, y) => order.indexOf(y) - order.indexOf(x))[0]; if (q.answer !== best) problems.push('biggest wrong'); }
    if (genId === 's4-will-it-light') { const broken = /not connected|switch open|rubber|dead battery/.test(q.story); if ((broken ? 'No' : 'Yes') !== q.answer) problems.push('circuit wrong'); }
    if (genId === 's4-conductor-or-insulator') { const metal = /copper|iron|aluminum|steel/.test(q.prompt); /* pass IB: the material is named in the question */ if ((metal ? 'Conductor' : 'Insulator') !== q.answer) problems.push('conductor wrong'); }
    if (genId === 's5-next-stage') { const cycle = ['evaporation', 'condensation', 'precipitation', 'collection']; const i = cycle.findIndex((x) => q.story.includes(x)); if (q.answer.toLowerCase() !== cycle[(i + 1) % 4]) problems.push('next stage wrong'); }
    if (genId === 's5-moon-phase') { const i = ['none of', 'half of', 'all of'].findIndex((x) => q.story.includes(x)); if (q.answer !== ['new moon', 'half moon', 'full moon'][i]) problems.push('moon phase wrong'); }
    if (genId === 's6-count-kinds') { const kinds = (q.story.match(/[A-Z]/g) || []).length; if (Number(q.answer) !== kinds) problems.push('count kinds wrong'); }
    if (genId === 's6-element-or-compound') { const kinds = (q.story.split(',')[0].match(/[A-Z]/g) || []).length; if ((kinds === 1 ? 'Element' : 'Compound') !== q.answer) problems.push('element or compound wrong'); }
    if (genId === 's3-next-season') { const seasons = ['spring', 'summer', 'fall', 'winter']; const i = seasons.findIndex((x) => q.story.includes(x)); if (q.answer !== seasons[(i + 1) % 4]) problems.push('next season wrong'); }
    if (genId === 's6-warm-to-cool' && q.answer !== 'From the stone into the water') problems.push('heat direction wrong');
    // Grade 12 math, re-derived from the prompt
    if (genId === 'g12-shift-direction') { const k = Number(q.story.match(/\d+/)[0]); const dir = /f\(x\) \+/.test(q.story) ? 'Up' : /f\(x\) -/.test(q.story) ? 'Down' : /f\(x - /.test(q.story) ? 'Right' : 'Left'; if (q.answer !== `${dir} ${k}`) problems.push('shift direction wrong'); }
    if (genId === 'g12-shifted-point') { const [x, y] = q.story.match(/\((-?\d+), (-?\d+)\)/).slice(1).map(Number); const mm = q.story.match(/f\(x ([+-]) (\d+)\) ([+-]) (\d+)/); const nx = x + (mm[1] === '-' ? 1 : -1) * Number(mm[2]); const ny = y + (mm[3] === '+' ? 1 : -1) * Number(mm[4]); if (q.answer !== `(${nx}, ${ny})`) problems.push('shifted point wrong'); }
    if (genId === 'g12-write-shift') { const [h, k] = q.prompt.match(/\d+/g).map(Number); if (q.answer !== `(x - ${h})² + ${k}`) problems.push('write shift wrong'); }
    if (genId === 'g12-compose-value') { const [m, c] = q.story.match(/\d+/g).map(Number); const x = Number(q.prompt.match(/\d+/)[0]); if (Number(q.answer) !== m * x * x + c) problems.push('compose value wrong'); }
    if (genId === 'g12-compose-order') { const [m, c] = q.story.match(/\d+/g).map(Number); const x = Number(q.prompt.match(/\d+/)[0]); if (Number(q.answer) !== (m * x + c) ** 2) problems.push('compose order wrong'); }
    if (genId === 'g12-unit-value') { const angle = Number(q.prompt.match(/\d+/)[0]); const fn = /sin/.test(q.prompt) ? 'sin' : 'cos'; const table = { 0: { cos: '1', sin: '0' }, 30: { cos: '√3/2', sin: '1/2' }, 45: { cos: '√2/2', sin: '√2/2' }, 60: { cos: '1/2', sin: '√3/2' }, 90: { cos: '0', sin: '1' } }; if (q.answer !== table[angle][fn]) problems.push('unit value wrong'); }
    if (genId === 'g12-quadrant-sign') { const angle = Number(q.prompt.match(/\d+/)[0]); const fn = /sin/.test(q.prompt) ? 'sin' : 'cos'; const positive = fn === 'sin' ? angle < 180 : angle > 270; if (q.answer !== (positive ? 'Positive' : 'Negative')) problems.push('quadrant sign wrong'); }
    if (genId === 'g12-half-life-left') { const [start, hl] = q.story.match(/\d+/g).map(Number); const t = Number(q.prompt.match(/\d+/)[0]); if (Number(q.answer.match(/\d+/)[0]) !== start / 2 ** (t / hl)) problems.push('half life left wrong'); }
    if (genId === 'g12-half-lives-count') { const [hl] = q.story.match(/\d+/g).map(Number); const t = Number(q.prompt.match(/\d+/)[0]); if (Number(q.answer) * hl !== t) problems.push('half lives count wrong'); }
    if (genId === 'g12-end-behavior') { const mm = q.story.match(/^(-?\d+)x\^(\d+)/); const lead = Number(mm[1]); const power = Number(mm[2]); const even = power % 2 === 0; const expected = even ? (lead > 0 ? 'Both ends go up' : 'Both ends go down') : (lead > 0 ? 'Down on the left, up on the right' : 'Up on the left, down on the right'); if (q.answer !== expected) problems.push('end behavior wrong'); }
    if (genId === 'g12-leading-term') { const mm = q.story.match(/([-+]) (\d+)x\^(\d+)/); if (q.answer !== `${mm[1] === '-' ? '-' : ''}${mm[2]}x^${mm[3]}`) problems.push('leading term wrong'); }
    // Grade 11 math, re-derived from the prompt
    if (genId === 'g11-quadratic-roots') { const [b, c] = q.story.match(/\d+/g).map(Number); const [lo, hi] = q.answer.match(/\d+/g).map(Number); if (lo + hi !== b || lo * hi !== c) problems.push('quadratic roots wrong'); }
    if (genId === 'g11-discriminant') { const mm = q.story.match(/^(\d*)x² \+ (\d+)x \+ (\d+)/); const a = mm[1] ? Number(mm[1]) : 1; const b = Number(mm[2]); const c = Number(mm[3]); if (Number(q.answer) !== b * b - 4 * a * c) problems.push('discriminant wrong'); }
    if (genId === 'g11-how-many-roots') { const d = Number(q.story.match(/-?\d+/)[0]); if (q.answer !== (d > 0 ? 'Two' : d === 0 ? 'One' : 'None')) problems.push('root count wrong'); }
    if (genId === 'g11-multiply-binomials') { const [p, qq] = q.prompt.match(/\d+/g).map(Number); if (q.answer !== `x² + ${p + qq}x + ${p * qq}`) problems.push('binomial product wrong'); }
    if (genId === 'g11-middle-term') { const [p, qq] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) !== p + qq) problems.push('middle term wrong'); }
    if (genId === 'g11-square-binomial') { const [p] = q.prompt.match(/\d+/g).map(Number); if (q.answer !== `x² + ${2 * p}x + ${p * p}`) problems.push('square binomial wrong'); }
    if (genId === 'g11-arithmetic-term') { const seq = q.story.match(/\d+/g).map(Number); const n = Number(q.prompt.match(/\d+/)[0]); if (Number(q.answer) !== seq[0] + (n - 1) * (seq[1] - seq[0])) problems.push('arithmetic term wrong'); }
    if (genId === 'g11-geometric-term') { const seq = q.story.match(/\d+/g).map(Number); const n = Number(q.prompt.match(/\d+/)[0]); if (Number(q.answer) !== seq[0] * (seq[1] / seq[0]) ** (n - 1)) problems.push('geometric term wrong'); }
    if (genId === 'g11-sequence-kind') { const seq = q.story.split(', ').map(Number); if (q.answer !== (seq[1] - seq[0] === seq[2] - seq[1] ? 'Arithmetic' : 'Geometric')) problems.push('sequence kind wrong'); }
    if (genId === 'g11-log-value') { const [b, y] = q.prompt.match(/\d+/g).map(Number); if (b ** Number(q.answer) !== y) problems.push('log value wrong'); }
    if (genId === 'g11-exp-to-log') { const [b, e, y] = q.story.match(/\d+/g).map(Number); if (q.answer !== `log base ${b} of ${y} = ${e}`) problems.push('exp to log wrong'); }
    if (genId === 'g11-log-to-exp') { const [b, y, e] = q.story.match(/\d+/g).map(Number); if (q.answer !== `${b}^${e} = ${y}`) problems.push('log to exp wrong'); }
    if (genId === 'g11-absolute-solve') { const [k, d] = q.story.match(/\d+/g).map(Number); if (q.answer !== `x = ${k + d} or x = ${k - d}`) problems.push('absolute solve wrong'); }
    if (genId === 'g11-absolute-value-of') { const n = Number(q.prompt.match(/-?\d+/)[0]); if (Number(q.answer) !== Math.abs(n)) problems.push('absolute value wrong'); }
    if (genId === 'g11-absolute-none') { if (q.answer !== (/= -\d/.test(q.story) ? 'None' : 'Two')) problems.push('absolute none wrong'); }
    // Grade 10 math, re-derived from the prompt
    if (genId === 'g10-vertical-angle') { const [a] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) !== a) problems.push('vertical angle wrong'); }
    if (genId === 'g10-supplementary') { const [a] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) !== 180 - a) problems.push('supplementary wrong'); }
    if (genId === 'g10-triangle-angle') { const [a, b] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) !== 180 - a - b) problems.push('triangle angle wrong'); }
    if (genId === 'g10-scale-factor') { const [small, big] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) * small !== big) problems.push('scale factor wrong'); }
    if (genId === 'g10-missing-side') { const [a, b, ak] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) * a !== b * ak) problems.push('missing side wrong'); }
    if (genId === 'g10-shadow') { const [stick, shadow, treeShadow] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) * shadow !== stick * treeShadow) problems.push('shadow wrong'); }
    if (genId === 'g10-translate') { const nums = q.story.match(/-?\d+/g).map(Number); const [x, y] = nums; const dx = (/left/.test(q.story) ? -1 : 1) * nums[2]; const dy = (/down/.test(q.story) ? -1 : 1) * nums[3]; if (q.answer !== `(${x + dx}, ${y + dy})`) problems.push('translate wrong'); }
    if (genId === 'g10-reflect') { const [x, y] = q.story.match(/-?\d+/g).map(Number); const overY = /y-axis/.test(q.story); if (q.answer !== (overY ? `(${-x}, ${y})` : `(${x}, ${-y})`)) problems.push('reflect wrong'); }
    if (genId === 'g10-rotate') { const [x, y] = q.story.match(/-?\d+/g).map(Number); if (q.answer !== `(${-y}, ${x})`) problems.push('rotate wrong'); }
    if (genId === 'g10-sine') { const [a, b, c] = q.story.match(/\d+/g).map(Number); if (q.answer !== `${a}/${c}`) problems.push('sine wrong'); }
    if (genId === 'g10-cosine') { const [a, b, c] = q.story.match(/\d+/g).map(Number); if (q.answer !== `${b}/${c}`) problems.push('cosine wrong'); }
    if (genId === 'g10-tangent') { const [a, b] = q.story.match(/\d+/g).map(Number); if (q.answer !== `${a}/${b}`) problems.push('tangent wrong'); }
    if (genId === 'g10-sector-fraction') { const [angle] = q.story.match(/\d+/g).map(Number); const [t, m] = q.answer.split('/').map(Number); if (t * 360 !== angle * m) problems.push('sector fraction wrong'); }
    if (genId === 'g10-arc-length') { const [r, angle] = q.story.match(/\d+/g).map(Number); if (Math.abs(Number(q.answer) - 2 * 3.14 * r * angle / 360) > 0.01) problems.push('arc length wrong'); }
    if (genId === 'g10-sector-area') { const [r, angle] = q.story.match(/\d+/g).map(Number); if (Math.abs(Number(q.answer) - 3.14 * r * r * angle / 360) > 0.01) problems.push('sector area wrong'); }
    // Grade 9 math, re-derived from the prompt
    if (genId === 'g9-both-sides') { const [a, c, b, d] = q.prompt.match(/\d+/g).map(Number); const x = Number(q.answer); if (a * x + c !== b * x + d) problems.push('both sides wrong'); }
    if (genId === 'g9-distribute-solve') { const [a, b, total] = q.prompt.match(/\d+/g).map(Number); if (a * (Number(q.answer) + b) !== total) problems.push('distribute solve wrong'); }
    if (genId === 'g9-evaluate-function') { const mm = q.story.match(/f\(x\) = (\d+)x ([+-]) (\d+)/); const m = Number(mm[1]); const c = (mm[2] === '-' ? -1 : 1) * Number(mm[3]); const x = Number(q.prompt.match(/\d+/)[0]); if (Number(q.answer) !== m * x + c) problems.push('evaluate function wrong'); }
    if (genId === 'g9-find-input') { const [m, c] = q.story.match(/\d+/g).map(Number); const out = Number(q.prompt.match(/= (\d+)/)[1]); if (m * Number(q.answer) + c !== out) problems.push('find input wrong'); }
    if (genId === 'g9-is-function') { const inputs = [...q.story.matchAll(/\((\d+), \d+\)/g)].map((mm) => mm[1]); if ((new Set(inputs).size === inputs.length ? 'Yes' : 'No') !== q.answer) problems.push('is function wrong'); }
    if (genId === 'g9-system-substitute') { const mm = q.story.match(/y = x \+ (\d+) and y = (\d+)x ([+-]) (\d+)/); const a = Number(mm[1]); const m = Number(mm[2]); const c = (mm[3] === '-' ? -1 : 1) * Number(mm[4]); const [x, y] = q.answer.match(/\d+/g).map(Number); if (y !== x + a || y !== m * x + c) problems.push('system wrong'); }
    if (genId === 'g9-check-pair') { const mm = q.story.match(/y = x \+ (\d+) and y = (\d+)x ([+-]) (\d+)/); const a = Number(mm[1]); const m = Number(mm[2]); const c = (mm[3] === '-' ? -1 : 1) * Number(mm[4]); const [px, py] = q.prompt.match(/\d+/g).map(Number); if (((py === px + a && py === m * px + c) ? 'Yes' : 'No') !== q.answer) problems.push('check pair wrong'); }
    if (genId === 'g9-factor-pair') { const [b, c] = q.story.match(/\d+/g).slice(1).map(Number); const [p, qq] = q.answer.match(/\d+/g).map(Number); if (p * qq !== c || p + qq !== b) problems.push('factor pair wrong'); }
    if (genId === 'g9-factor-trinomial') { const [b, c] = q.prompt.match(/\d+/g).slice(1).map(Number); const [p, qq] = q.answer.match(/\d+/g).map(Number); if (p * qq !== c || p + qq !== b) problems.push('factor trinomial wrong'); }
    if (genId === 'g9-zeros') { const [lo, hi] = q.story.match(/\d+/g).map(Number); if (q.answer !== `x = -${lo} or x = -${hi}`) problems.push('zeros wrong'); }
    if (genId === 'g9-linear-or-exponential') { const seq = q.story.split(', ').map(Number); const linear = seq[1] - seq[0] === seq[2] - seq[1]; if ((linear ? 'Linear' : 'Exponential') !== q.answer) problems.push('linear or exponential wrong'); }
    if (genId === 'g9-growth-value') { const [start, rate] = q.story.match(/\d+/g).map(Number); const t = Number(q.prompt.match(/\d+/)[0]); if (Number(q.answer) !== start * rate ** t) problems.push('growth value wrong'); }
    if (genId === 'g9-next-term') { const seq = q.story.match(/\d+/g).map(Number); if (Number(q.answer) * seq[1] !== seq[2] * seq[2]) problems.push('next term wrong'); }
    // Grade 8 math, re-derived from the prompt
    if (genId === 'g8-slope-points') { const [x1, y1, x2, y2] = q.story.match(/-?\d+/g).map(Number); if (Number(q.answer) * (x2 - x1) !== y2 - y1) problems.push('slope from points wrong'); }
    if (genId === 'g8-slope-from-equation') { const m = Number(q.story.match(/y = (-?\d+)x/)[1]); if (Number(q.answer) !== m) problems.push('slope from equation wrong'); }
    if (genId === 'g8-intercept-from-equation') { const mm = q.story.match(/x ([+-]) (\d+)/); const b = (mm[1] === '-' ? -1 : 1) * Number(mm[2]); if (Number(q.answer) !== b) problems.push('intercept wrong'); }
    if (genId === 'g8-power-value') { const [base, e] = q.prompt.match(/\d+/g).map(Number); if (Number(q.answer) !== base ** e) problems.push('power value wrong'); }
    if (genId === 'g8-multiply-powers') { const [base, a, base2, b] = q.prompt.match(/\d+/g).map(Number); if (q.answer !== `${base}^${a + b}`) problems.push('multiply powers wrong'); }
    if (genId === 'g8-divide-powers') { const [base, a, base2, b] = q.prompt.match(/\d+/g).map(Number); if (q.answer !== `${base}^${a - b}`) problems.push('divide powers wrong'); }
    if (genId === 'g8-zero-negative-power') { const [base, e] = q.prompt.match(/\d+/g).map(Number); if (/\^0/.test(q.prompt) ? q.answer !== '1' : q.answer !== `1/${base ** e}`) problems.push('zero or negative power wrong'); }
    if (genId === 'g8-square-root') { const [sq] = q.prompt.match(/\d+/g).map(Number); if (Number(q.answer) ** 2 !== sq) problems.push('square root wrong'); }
    if (genId === 'g8-square-of') { const [n] = q.prompt.match(/\d+/g).map(Number); if (Number(q.answer) !== n * n) problems.push('square of wrong'); }
    if (genId === 'g8-root-between') { const [n] = q.prompt.match(/\d+/g).map(Number); const [lo, hi] = q.answer.match(/\d+/g).map(Number); if (!(lo * lo < n && n < hi * hi && hi === lo + 1)) problems.push('root between wrong'); }
    if (genId === 'g8-hypotenuse') { const [a, b] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) ** 2 !== a * a + b * b) problems.push('hypotenuse wrong'); }
    if (genId === 'g8-missing-leg') { const [c, a] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) ** 2 !== c * c - a * a) problems.push('missing leg wrong'); }
    if (genId === 'g8-is-right-triangle') { const [a, b, c] = q.story.match(/\d+/g).map(Number); if ((a * a + b * b === c * c ? 'Yes' : 'No') !== q.answer) problems.push('right triangle check wrong'); }
    if (genId === 'g8-to-scientific') { const shown = Number(q.prompt.match(/[\d,]+/)[0].replace(/,/g, '')); const mm = q.answer.match(/(\d+)\.(\d+) x 10\^(\d+)/); const val = (Number(mm[1]) + Number(mm[2]) / 10) * 10 ** Number(mm[3]); if (Math.abs(val - shown) > 0.5) problems.push('to scientific wrong'); }
    if (genId === 'g8-from-scientific') { const mm = q.prompt.match(/(\d+)\.(\d+) x 10\^(\d+)/); if (Number(q.answer.replace(/,/g, '')) !== Math.round((Number(mm[1]) + Number(mm[2]) / 10) * 10 ** Number(mm[3]))) problems.push('from scientific wrong'); }
    if (genId === 'g8-compare-scientific') { const parts = [...q.prompt.matchAll(/(\d+) x 10\^(\d+)/g)].map((mm) => [Number(mm[1]), Number(mm[2])]); const bigger = parts[0][1] > parts[1][1] ? `${parts[0][0]} x 10^${parts[0][1]}` : `${parts[1][0]} x 10^${parts[1][1]}`; if (q.answer !== bigger) problems.push('compare scientific wrong'); }
    // Grade 7 math, re-derived from the prompt
    if (genId === 'g7-unit-rate') { const [n, total] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) * n !== total) problems.push('unit rate wrong'); }
    if (genId === 'g7-solve-proportion') { const [a, b] = q.story.match(/\d+/g).map(Number); const [c] = q.prompt.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) * a !== b * c) problems.push('proportion wrong'); }
    if (genId === 'g7-is-proportional') { const [a, b, c, d] = q.story.match(/\d+/g).map(Number); if ((a * d === b * c ? 'Yes' : 'No') !== q.answer) problems.push('proportional check wrong'); }
    if (genId === 'g7-percent-of') { const [pct, base] = q.prompt.match(/\d+/g).map(Number); if (Number(q.answer) !== base * pct / 100) problems.push('percent of wrong'); }
    if (genId === 'g7-discount') { const [price, pct] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) !== price - price * pct / 100) problems.push('discount wrong'); }
    if (genId === 'g7-what-percent') { const [part, base] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) * base !== part * 100) problems.push('what percent wrong'); }
    if (genId === 'g7-add-integers') { const [a, b] = q.prompt.match(/-?\d+/g).map(Number); if (Number(q.answer) !== a + b) problems.push('add integers wrong'); }
    if (genId === 'g7-subtract-integers') { const [a, b] = q.prompt.match(/-?\d+/g).map(Number); if (Number(q.answer) !== a - b) problems.push('subtract integers wrong'); }
    if (genId === 'g7-two-step') { const [m, c, total] = q.prompt.match(/\d+/g).map(Number); if (m * Number(q.answer) + c !== total) problems.push('two step wrong'); }
    if (genId === 'g7-two-step-subtract') { const [m, c, total] = q.prompt.match(/\d+/g).map(Number); if (m * Number(q.answer) - c !== total) problems.push('two step subtract wrong'); }
    if (genId === 'g7-first-step') { const [m, c] = q.story.match(/\d+/g).map(Number); if (q.answer !== `Subtract ${c} from both sides`) problems.push('first step wrong'); }
    if (genId === 'g7-circumference') { const [d] = q.story.match(/\d+/g).map(Number); if (Math.abs(Number(q.answer) - 3.14 * d) > 0.01) problems.push('circumference wrong'); }
    if (genId === 'g7-circle-area') { const [r] = q.story.match(/\d+/g).map(Number); if (Math.abs(Number(q.answer) - 3.14 * r * r) > 0.01) problems.push('circle area wrong'); }
    if (genId === 'g7-radius-or-diameter') { const [n] = q.story.match(/\d+/g).map(Number); const askD = /diameter\?/.test(q.prompt); if (Number(q.answer) !== (askD ? n * 2 : n / 2)) problems.push('radius or diameter wrong'); }
    // Grade 6 math, re-derived from the prompt
    if (genId === 'g6-simplify-ratio') { const [a, b] = q.prompt.match(/\d+/g).map(Number); const [x, y] = q.answer.split(':').map(Number); if (a * y !== b * x) problems.push('ratio simplify wrong'); }
    if (genId === 'g6-scale-ratio') { const [a, b] = q.story.match(/\d+/g).map(Number); const [ak] = q.prompt.match(/\d+/g).map(Number); if (Number(q.answer) * a !== b * ak) problems.push('ratio scale wrong'); }
    if (genId === 'g6-ratio-from-words') { const [a, b] = q.story.match(/\d+/g).map(Number); if (q.answer !== `${a}:${b}`) problems.push('ratio words wrong'); }
    if (genId === 'g6-whole-by-fraction') { const [n, one, d] = q.prompt.match(/\d+/g).map(Number); if (Number(q.answer) !== n * d) problems.push('whole by fraction wrong'); }
    if (genId === 'g6-divide-by-fraction') { const [a, b, c, d] = q.prompt.match(/\d+/g).map(Number); const parts = q.answer.split('/').map(Number); const val = parts.length === 2 ? parts[0] / parts[1] : parts[0]; if (Math.abs(val - (a / b) / (c / d)) > 0.0001) problems.push('divide by fraction wrong'); }
    if (genId === 'g6-compare-negatives') { const [a, b] = q.prompt.match(/-?\d+/g).map(Number); if (Number(q.answer) !== Math.min(a, b)) problems.push('compare negatives wrong'); }
    if (genId === 'g6-opposite') { const [n] = q.prompt.match(/-?\d+/g).map(Number); if (Number(q.answer) !== -n) problems.push('opposite wrong'); }
    if (genId === 'g6-order-negatives') { const nums = q.story.match(/-?\d+/g).map(Number); if (q.answer !== [...nums].sort((x, y) => x - y).join(', ')) problems.push('order negatives wrong'); }
    if (genId === 'g6-temperature') { const [st, dr] = q.story.match(/-?\d+/g).map(Number); if (Number(q.answer.match(/-?\d+/)[0]) !== st - dr) problems.push('temperature wrong'); }
    if (genId === 'g6-triangle-area') { const [b, h] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) !== b * h / 2) problems.push('triangle area wrong'); }
    if (genId === 'g6-parallelogram-area') { const [b, h] = q.story.match(/\d+/g).map(Number); if (Number(q.answer.match(/\d+/)[0]) !== b * h) problems.push('parallelogram area wrong'); }
    if (genId === 'g6-missing-height') { const [area, b] = q.story.match(/\d+/g).map(Number); if (Number(q.answer) * b !== 2 * area) problems.push('missing height wrong'); }
    if (genId === 'g6-solve-add') { const [p, qv] = q.prompt.match(/\d+/g).map(Number); if (Number(q.answer) + p !== qv) problems.push('solve add wrong'); }
    if (genId === 'g6-solve-multiply') { const [p, qv] = q.prompt.match(/\d+/g).map(Number); if (Number(q.answer) * p !== qv) problems.push('solve multiply wrong'); }
    if (genId === 'g6-check-solution') { const [claimed, p, qv] = q.story.match(/\d+/g).map(Number); if ((claimed + p === qv ? 'Yes' : 'No') !== q.answer) problems.push('check solution wrong'); }
    if (genId === 'r5-pov' && (q.answer === 'First person') !== /\b(I|we|my|me|our)\b/.test(q.story)) problems.push('point of view wrong');
    // Grade 4 reading, re-derived from the fixed lists
    if (genId === 'r4-simile-or-metaphor' && (q.answer === 'Simile') !== /\b(like|as)\b/.test(q.story)) problems.push('simile or metaphor wrong');
    if (genId === 'r4-find-figurative' && !/\b(like|as|was a|is a|were a)\b/.test(q.answer)) problems.push('figurative pick wrong');
    if (genId === 'pl-name-letter' && q.answer !== q.visual.text) problems.push('pre-K name letter wrong');
    if (genId === 'rs-pick-word' && q.answer[0].toUpperCase() !== q.prompt.match(/starts with ([A-Z])/)[1]) problems.push('picked word starts with the wrong letter');
    if (genId === 'rs-same-start') { const w = q.story.replace(/\.$/, '').toLowerCase(); if (q.answer[0] !== w[0]) problems.push('same-start word differs'); if (q.choices.filter((c) => c[0] === w[0]).length !== 1) problems.push('same-start has two matches'); }
    if (genId === 'rs-odd-start') { const firsts = q.choices.map((c) => c[0]); const odd = q.choices.find((c) => firsts.filter((f) => f === c[0]).length === 1); if (q.answer !== odd) problems.push('odd start wrong'); }
    if (genId === 'rr-does-rhyme') { const [a, c] = q.story.replace(/\./g, '').trim().toLowerCase().split(/\s+/); /* pass IC: the setup shows Pup. Cup. */ if ((RHYME_END(a) === RHYME_END(c) ? 'Yes' : 'No') !== q.answer) problems.push('rhyme yes/no wrong'); }
    if (genId === 'rr-pick-rhyme') { const a = q.story.replace(/\.$/, '').toLowerCase(); if (RHYME_END(q.answer) !== RHYME_END(a)) problems.push('picked rhyme does not rhyme'); if (q.choices.filter((c) => RHYME_END(c) === RHYME_END(a)).length !== 1) problems.push('two choices rhyme'); }
    if (genId === 'rr-odd-rhyme') { const ends = q.choices.map(RHYME_END); const odd = q.choices.find((c) => ends.filter((e) => e === RHYME_END(c)).length === 1); if (q.answer !== odd) problems.push('odd rhyme wrong'); }
    if (genId === 'rr-same-end') { const end = q.prompt.match(/ends with (\w+)/)[1]; if (!q.answer.endsWith(end)) problems.push('same-end word does not end that way'); }
    if (genId === 'rr-which-two') { const [x, y] = q.answer.split(' and '); if (RHYME_END(x) !== RHYME_END(y)) problems.push('which-two pair does not rhyme'); }
    if (problems.length) bad.push(`seed ${seed}: ${problems.join('; ')}`);
  }
  ok(`${genId}: 300 seeds all valid and arithmetically correct`, bad.length === 0, bad.slice(0, 3).join(' | '));
}
{ const twice = [...whenAnswers].filter(([, years]) => years.size > 1).map(([story, years]) => `${story} -> ${[...years].join('/')}`);
  ok('no event is told with two different years anywhere in the bank', twice.length === 0, twice.slice(0, 5).join(' | ')); }

// ---- 2. Determinism: same seed => identical question; different seed => usually different ----
ok('same seed gives identical question', JSON.stringify(L.generateQuestion('m3-different', 7)) === JSON.stringify(L.generateQuestion('m3-different', 7)));
ok('different seeds give different questions', JSON.stringify([L.generateQuestion('m1-part-eaten', 1).story, L.generateQuestion('m1-part-eaten', 1).choices]) !== JSON.stringify([L.generateQuestion('m1-part-eaten', 2).story, L.generateQuestion('m1-part-eaten', 2).choices]));

// ---- 3. Attempts ----
const att = L.buildAttempt('fraction-meaning', 123, []);
ok('attempt has 5 core questions', att.core.length === L.CONFIG.CORE_QUESTIONS_PER_ATTEMPT);
ok('first module never gets a review question', att.review === null);
ok('core questions belong to the module', att.core.every((q) => L.getModule('fraction-meaning').generators.includes(q.genId)));
const att2 = L.buildAttempt('equivalent-fractions', 5, ['fraction-meaning']);
ok('later module gets a review question from an earlier mastered module', att2.review && att2.review.moduleId === 'fraction-meaning');
ok('no review question when nothing earlier is mastered', L.buildAttempt('equivalent-fractions', 5, []).review === null);
ok('attempt is reproducible from its seed', JSON.stringify(L.buildAttempt('comparing-fractions', 9, ['fraction-meaning'])) === JSON.stringify(L.buildAttempt('comparing-fractions', 9, ['fraction-meaning'])));

// ---- 4. Answer checking ----
const nq = { type: 'number', answer: '12' };
ok('number: "12" correct', L.checkAnswer(nq, '12'));
ok('number: " 12 " correct (whitespace ok)', L.checkAnswer(nq, ' 12 '));
ok('number: "twelve" wrong', !L.checkAnswer(nq, 'twelve'));
ok('number: empty wrong', !L.checkAnswer(nq, ''));
ok('choice: exact match required', L.checkAnswer({ type: 'choice', answer: '3/4' }, '3/4') && !L.checkAnswer({ type: 'choice', answer: '3/4' }, '6/8'));

// ---- 5. Mastery, locking, reset, report — all derived from events ----
const core = (n) => Array.from({ length: 5 }, (_, i) => ({ genId: 'x', seed: i, prompt: 'p', answer: 'a', given: i < n ? 'a' : 'b', correct: i < n }));
const ev = (moduleId, n, at, review = null) => L.makeAttemptEvent({ moduleId, seed: 1 }, core(n), review, at, at);
let events = [];
let p = L.deriveProgress(events);
  ok('fresh: a first module with no outside prerequisite is available, everything else locked', L.COURSES.every((c) => { const st = L.moduleStatuses(p).filter((x) => c.modules.some((m) => m.id === x.id)); return st.every((x) => { const req = L.prerequisitesOf(x.id); return x.status === (req.length === 0 ? 'available' : 'locked'); }); }));
events.push(ev('fraction-meaning', 3, '2026-09-03T10:00:00Z'));
p = L.deriveProgress(events);
ok('3 of 5 does not master', !p.perModule['fraction-meaning'].mastered && p.perModule['fraction-meaning'].attempts === 1);
events.push(ev('fraction-meaning', 4, '2026-09-03T10:10:00Z'));
p = L.deriveProgress(events);
ok('4 of 5 masters and unlocks module 2', p.perModule['fraction-meaning'].mastered && L.moduleStatuses(p)[1].status === 'available' && L.moduleStatuses(p)[2].status === 'locked');
ok('masteredAt is the time of the passing attempt', p.perModule['fraction-meaning'].masteredAt === '2026-09-03T10:10:00Z');
events.push(ev('equivalent-fractions', 5, '2026-09-03T10:20:00Z', { moduleId: 'fraction-meaning', genId: 'x', seed: 1, prompt: 'p', answer: 'a', given: 'b', correct: false }));
p = L.deriveProgress(events);
ok('review question counted for retention, not for the gate', p.review.asked === 1 && p.review.correct === 0 && p.perModule['equivalent-fractions'].mastered);
const r = L.buildReport('Test', events);
ok('report: 2 mastered, 3 attempts, accuracy 70% on module 1', r.modulesMastered === 2 && r.modulesTotal === L.MODULES.length && r.totalAttempts === 3 && r.modules.find((m) => m.id === 'fraction-meaning').accuracyPercent === 70);
ok('report carries its definitions', r.definitions.length >= 4);
events.push(L.makeResetEvent('2026-09-03T11:00:00Z'));
p = L.deriveProgress(events);
ok('reset: history kept, but nothing counts as mastered afterwards', events.length === 4 && p.masteredIds.length === 0 && L.moduleStatuses(p)[0].status === 'available');

// ---- 6. Confidence score follows its printed rules ----
{
  const t = (i) => new Date(2026, 8, 3, 10, i).toISOString();
  const core = (pattern, ms = 9000) => pattern.split('').map((c, i) => { const r = { genId: 'm1-picture', seed: i + 1, prompt: 'q', answer: '1/2', given: c === '1' ? '1/2' : '1/3', correct: c === '1' }; if (ms !== null) r.timeMs = ms; return r; });
  const att = (moduleId, pattern, at, review = null, ms) => {
    const results = core(pattern, ms);
    return { type: 'attempt_completed', at, startedAt: at, moduleId: moduleId, seed: 1, core: results, review, coreCorrect: results.filter((r) => r.correct).length, coreTotal: results.length };
  };
  const M = 'fraction-meaning';
  ok('confidence: no attempts -> no score', L.computeConfidence(M, []).score === null);
  ok('confidence: 3 of 5, not mastered -> 1', L.computeConfidence(M, [att(M, '11100', t(1))]).score === 1);
  ok('confidence: mastered with 4 of 5 -> 3', L.computeConfidence(M, [att(M, '11110', t(1))]).score === 3);
  ok('confidence: mastered and latest set perfect -> 4', L.computeConfidence(M, [att(M, '11110', t(1)), att(M, '11111', t(2))]).score === 4);
  ok('confidence: 10 correct in a row -> 5', L.computeConfidence(M, [att(M, '11111', t(1)), att(M, '11111', t(2))]).score === 5);
  const rev = (correct) => ({ moduleId: M, genId: 'm1-picture', seed: 1, prompt: 'q', answer: '1/2', given: '1/2', correct });
  const withRetention = [att(M, '11110', t(1)), att('equivalent-fractions', '11110', t(2), rev(true)), att('equivalent-fractions', '11111', t(3), rev(true))];
  ok('confidence: mastered + 2 of 2 review questions right -> 4', L.computeConfidence(M, withRetention).score === 4);
  ok('confidence: never above 5', L.computeConfidence(M, [att(M, '11111', t(1)), att(M, '11111', t(2)), att('equivalent-fractions', '11111', t(3), rev(true)), att('equivalent-fractions', '11111', t(4), rev(true))]).score === 5);
  const guessy = L.computeConfidence(M, [att(M, '11100', t(1), null, 1500)]);
  ok('confidence: two fast wrong answers flags guessing', guessy.signals.includes('guessing?'));
  ok('confidence: slow wrong answers do not flag guessing', !L.computeConfidence(M, [att(M, '11100', t(1), null, 9000)]).signals.includes('guessing?'));
  ok('confidence: median time reported in seconds', L.computeConfidence(M, [att(M, '11111', t(1), null, 6500)]).medianSec === 6.5);
  ok('confidence: missing timings do not break it', L.computeConfidence(M, [att(M, '11111', t(1), null, null)]).medianSec === null);
  const rep = L.buildReport('Test', [att(M, '11110', t(1))]);
  ok('report includes a confidence score per module', rep.modules.find((m) => m.id === M).confidence.score === 3 && rep.modules.find((m) => m.id === 'equivalent-fractions').confidence.score === null);
  ok('report prints the confidence rules', rep.definitions.some((d) => d.startsWith('Confidence starts at 1')));
  ok('every question has a one-sentence prompt and a story or null', Object.keys(L.GENERATORS).every((g) => { const q = L.generateQuestion(g, 7); return typeof q.prompt === 'string' && (q.story === null || typeof q.story === 'string'); }));
  ok('explanation pictures are valid bars or a group of dots', Object.keys(L.GENERATORS).every((g) => { const q = L.generateQuestion(g, 11); if (q.explainVisual === null) return true; if (Array.isArray(q.explainVisual)) return q.explainVisual.every((b) => Number.isInteger(b.parts) && b.parts >= 2 && b.shaded >= 0 && b.shaded <= b.parts && typeof b.label === 'string'); if (q.explainVisual.kind === 'letters') return typeof q.explainVisual.text === 'string' && q.explainVisual.text.length > 0; if (q.explainVisual.kind === 'numberline') return q.explainVisual.from < q.explainVisual.to && (q.explainVisual.marks || []).every((v) => v >= q.explainVisual.from && v <= q.explainVisual.to); if (q.explainVisual.kind === 'tri') return q.explainVisual.base > 0 && q.explainVisual.height > 0; if (q.explainVisual.kind === 'percentgrid') return q.explainVisual.shaded >= 0 && q.explainVisual.shaded <= 100; if (q.explainVisual.kind === 'pic') return typeof q.explainVisual.name === 'string' && q.explainVisual.name.length > 0; if (q.explainVisual.kind === 'pair') return [q.explainVisual.a, q.explainVisual.b].every((h) => h && typeof h.kind === 'string' && (h.name || h.colour || h.shape || h.count)); return q.explainVisual.kind === 'dots' && q.explainVisual.count >= 1 && q.explainVisual.count <= 10; }));
}

// ---- 7. Courses, subjects, and the per-learner course switch ----
{
  ok('every module belongs to a course with a subject', L.MODULES.every((m) => L.getCourse(m.courseId) && typeof L.getCourse(m.courseId).subject === 'string'));
  ok('coverage rule: every module has at least 5 question types, except writing which is one piece per round', L.MODULES.every((m) => m.generators.length >= 5 || (L.getCourse(m.courseId) || {}).educatorMarked));
  ok('all courses enabled by default', JSON.stringify(L.enabledCourseIds([])) === JSON.stringify(L.COURSES.map((c) => c.id)));
  const off = L.makeCoursesEnabledEvent([], '2026-09-03T10:00:00.000Z');
  ok('educator can switch every course off', L.enabledCourseIds([off]).length === 0);
  const on = L.makeCoursesEnabledEvent(['fractions-intro', 'not-a-real-course'], '2026-09-03T10:01:00.000Z');
  ok('unknown course ids are ignored, latest setting wins', JSON.stringify(L.enabledCourseIds([off, on])) === '["fractions-intro"]');
  const reset = L.makeResetEvent('2026-09-03T10:02:00.000Z');
  ok('course setting survives a progress reset', L.buildReport('T', [off, reset]).enabledCourseIds.length === 0);
  ok('report rows carry subject and course', L.buildReport('T', []).modules.every((m) => typeof m.subject === 'string' && typeof m.courseTitle === 'string'));
  ok('kindergarten course exists, is read-aloud, and has thirteen modules', L.getCourse('counting-k') && L.getCourse('counting-k').readAloud === true && L.getCourse('counting-k').modules.length === 14);
  ok('reading course exists in a second subject', L.getCourse('letters-k') && L.getCourse('letters-k').subject === 'Reading' && L.getCourse('letters-k').readAloud === true);
  ok('describeChoice turns a picture choice into words', L.describeChoice('dots:4') === 'the group with 4' && L.describeChoice('3/4') === '3/4');
}

// ---- 8. Wonder: open questions, never stored words, never graded ----
{
  const allApproved = L.WONDER.reduce((r, w) => L.approveWonder(r, w.id), L.emptyWonderReview());
  ok('every course has a Wonder question once approved', L.COURSES.every((c) => L.wonderFor(c.id, 0, allApproved) !== null));
  ok('nothing is offered to a student before somebody approves it', L.COURSES.every((c) => L.wonderFor(c.id, 0, L.emptyWonderReview()) === null));
  ok('everything starts out awaiting review', L.wonderAwaitingReview(L.emptyWonderReview()) === L.WONDER.length);
  ok('approving one leaves the rest waiting', L.wonderAwaitingReview(L.approveWonder(L.emptyWonderReview(), 'w-one-thing')) === L.WONDER.length - 1);
  ok('an approved question can be withdrawn again', L.wonderFor('fractions-intro', 0, L.unapproveWonder(allApproved, 'w-one-thing')) === null);
  const hiddenState = L.hideWonder(allApproved, 'w-one-thing');
  ok('hiding a question also withdraws its approval', L.isWonderApproved(hiddenState, 'w-one-thing') === false && L.isWonderHidden(hiddenState, 'w-one-thing'));
  ok('a hidden question is not counted as awaiting review', L.wonderAwaitingReview(hiddenState) === 0);
  ok('a hidden question can be brought back for review', L.wonderAwaitingReview(L.restoreWonder(hiddenState, 'w-one-thing')) === 1);
  ok('questions run from the first met in pre-K to the last', L.wonderInOrder()[0].stage === 'early' && L.wonderInOrder().slice(-1)[0].stage === 'grown');
  ok('every question names a stage the platform knows', L.WONDER.every((w) => L.LIFE_STAGES.some((st) => st.id === w.stage)));
  ok('approve all approves everything not removed', L.approveAllWonder(L.emptyWonderReview()).approved.length === L.WONDER.length);
  ok('approve all leaves removed questions removed', L.approveAllWonder(hiddenState).approved.includes('w-one-thing') === false);
  ok('un-approve all sends everything back to awaiting review and keeps removals', L.unapproveAllWonder(allApproved).approved.length === 0 && L.unapproveAllWonder(hiddenState).hidden.includes('w-one-thing'));
  { const done = ['colours', 'same-and-different', 'match-the-vehicles', 'match-the-things', 'match-the-water-animals', 'match-the-land-animals', 'match-the-shapes', 'match-the-solids', 'more-and-fewer-5', 'bigger-and-smaller', 'patterns', 'count-to-3', 'first-strokes', 'connect-the-dots', 'draw-the-shapes', 'taking-turns', 'big-bigger-biggest', 'helpers-all-around'].map((id, i) => ({ type: 'attempt_completed', at: `u${i}`, startedAt: 'u', moduleId: id, seed: 1, core: [], review: null, coreCorrect: 5, coreTotal: 5 }));
    ok('finishing a course unlocks the next course up in that subject', JSON.stringify(L.coursesToUnlock([L.makeCoursesEnabledEvent(['first-steps-pk'], 't'), ...done])) === '["counting-k"]');
    ok('nothing unlocks while a course is unfinished', L.coursesToUnlock([L.makeCoursesEnabledEvent(['first-steps-pk'], 't'), ...done.slice(0, 2)]).length === 0); }
  // The cadence: one reflection after every two mastered modules, rotating through the pool
  const pass = (id, at) => ({ type: 'attempt_completed', at, startedAt: at, moduleId: id, seed: 1, core: [], review: null, coreCorrect: 5, coreTotal: 5 });
  const one = [pass('count-to-5', '2026-09-01T10:00:00.000Z')];
  const two = [...one, pass('count-to-10', '2026-09-01T11:00:00.000Z')];
  ok('one round is not yet due a reflection', L.nextWonder(one, 'counting-k', allApproved) === null);
  ok('two rounds are due one', L.nextWonder(two, 'counting-k', allApproved) !== null);
  const failed = (id, at) => ({ ...pass(id, at), coreCorrect: 1 });
  ok('failed rounds count too, so a struggling child meets more reflections', L.nextWonder([failed('count-to-5', 't1'), failed('count-to-10', 't2')], 'counting-k', allApproved) !== null);
  ok('two rounds of the same module count as one module, so it is not yet due', L.nextWonder([pass('count-to-5', 't1'), pass('count-to-5', 't2')], 'counting-k', allApproved) === null);
  ok('after a failed round the reflection is about failure, feelings, or getting through', ['failure', 'feelings', 'ups-and-downs'].includes(L.nextWonder([failed('count-to-5', 't1'), failed('count-to-10', 't2')], 'counting-k', allApproved).theme));
  ok('a pre-reader only ever gets a question with two spoken voices', Array.isArray(L.nextWonder(two, 'counting-k', allApproved, true).simple));
  ok('nothing is due when nothing is approved', L.nextWonder(two, 'counting-k', L.emptyWonderReview()) === null);
  const first = L.nextWonder(two, 'counting-k', allApproved);
  const answered = [...two, L.makeWonderEvent(first.id, 'count-to-10', '2026-09-01T11:30:00.000Z', 20, 1)];
  ok('answering one resets the count', L.nextWonder(answered, 'counting-k', allApproved) === null);
  const more = [...answered, pass('one-more-one-less', '2026-09-02T10:00:00.000Z'), pass('joining-and-taking-away', '2026-09-02T11:00:00.000Z')];
  const second = L.nextWonder(more, 'counting-k', allApproved);
  ok('the next reflection is a different question, not a repeat', second !== null && second.id !== first.id);
  ok('the pool is shared across courses at the same stage', L.WONDER.filter((w) => w.stage === 'early').length >= 5);
  // Never a third time: exhaust every early question twice, and the reflection is skipped
  const earlyIds = L.WONDER.filter((w) => w.stage === 'early').map((w) => w.id);
  let log = []; let t = 0;
  for (let round = 0; round < 2; round++) for (const id of earlyIds) log.push(L.makeWonderEvent(id, 'count-to-5', `2026-09-0${1 + (t++ % 8)}T${String(10 + (t % 12)).padStart(2, '0')}:00:00.000Z`, 10, 1));
  log.sort((a, b) => a.at.localeCompare(b.at));
  const exhausted = [...log, pass('count-to-5', '2026-09-20T10:00:00.000Z'), pass('count-to-10', '2026-09-20T11:00:00.000Z')];
  ok('once every question has been answered twice, no reflection is offered rather than a repeat', L.nextWonder(exhausted, 'counting-k', allApproved) === null);
  const almost = exhausted.filter((e) => !(e.type === 'wonder_answered' && e.wonderId === earlyIds[0] && e === log.filter((x) => x.wonderId === earlyIds[0])[1]));
  ok('a question answered only once is still offered before any repeats', L.nextWonder(almost, 'counting-k', allApproved) !== null && L.nextWonder(almost, 'counting-k', allApproved).id === earlyIds[0]);
  ok('every Wonder question has four perspectives and a closing question', L.WONDER.every((w) => w.perspectives.length === 4 && w.closing.includes('?')));
  ok('the game that opens first is a playful one: Pong leads a list of decks and quick fires', (() => { const deck = { id: 'a', kind: 'pairs' }, quick = { id: 'b', kind: 'sprint' }, pong = { id: 'c', kind: 'pong' }; const out = L.funFirst([deck, quick, pong]); return out[0] === pong && out.length === 3 && out[1] === deck && out[2] === quick; })());
  ok('a list with nothing playful keeps its order', (() => { const a = { id: 'a', kind: 'pairs' }, b = { id: 'b', kind: 'evidence' }; const out = L.funFirst([a, b]); return out[0] === a && out[1] === b; })());
  ok('every perspective is written in complete sentences, not fragments', L.WONDER.every((w) => w.perspectives.every((p) => p.says.split('. ').every((sentence) => sentence.trim().split(/\s+/).length >= 5))));
  ok('no perspective uses an em dash', L.WONDER.every((w) => w.perspectives.every((p) => !p.says.includes('\u2014'))));
  ok('pick-mode Wonder questions offer options', L.WONDER.filter((w) => w.answerMode === 'pick').every((w) => Array.isArray(w.options) && w.options.length >= 2));
  { // Pass IS: a child who cannot read yet hears the question and then every choice, in order, with Or before the last.
    const spokenEarly = L.WONDER.filter((w) => w.stage === 'early' && w.answerMode === 'pick' && Array.isArray(w.simple));
    ok('a pre-reader hears the Wonder question and then every choice, in order', spokenEarly.length > 0 && spokenEarly.every((w) => { const p = L.wonderSpokenParts(w); return p.length === w.options.length + 1 && p[0] === w.prompt && w.options.every((o, i) => p[i + 1].includes(o)) && p[p.length - 1].startsWith('Or '); }));
    ok('the two voices a pre-reader hears are short and end like sentences', spokenEarly.every((w) => w.simple.length === 2 && w.simple.every((v) => /[.?!]$/.test(v.says) && v.says.split(/\s+/).length <= 20)));
    ok('every Wonder question has its own id', new Set(L.WONDER.map((w) => w.id)).size === L.WONDER.length);
    ok('every Wonder question carries a theme the rotation knows', L.WONDER.every((w) => Object.keys(L.WONDER_THEMES).includes(w.theme || 'world')));
  }
  { // Pass IX: no Wonder voice tells a child to vent a feeling out (give it somewhere to go, stomp it out, squeeze or punch a
    // pillow). The evidence supports calming the body and absorbing distraction (Bushman 2002; Kjaervik and Bushman 2024;
    // Drake and Winner 2013). Prompts may still ask about the myth; only the voices are read.
    const VENTING = /somewhere to go|out of your body|squeeze a pillow|stomp (it |out )|let (it|your anger|the anger|your feelings) out|punch(ing)? a pillow/i;
    const voices = L.WONDER.flatMap((w) => [...w.perspectives.map((p) => p.says), ...(w.simple || []).map((v) => v.says)]);
    ok('no Wonder voice recommends venting a feeling out', voices.every((t) => !VENTING.test(t)), voices.filter((t) => VENTING.test(t)).join(' | '));
  }
  { // Pass IT (Mikey's screenshots): every picture a lesson or a question names has a drawing, so none falls back to a grey circle.
    const uiSrc = readFileSync(new URL('../src/ui.jsx', import.meta.url), 'utf8'); const logicSrc = readFileSync(new URL('../src/logic.mjs', import.meta.url), 'utf8');
    const iconBody = uiSrc.slice(uiSrc.indexOf('function IconPic('), uiSrc.indexOf('}[name] ||', uiSrc.indexOf('function IconPic(')));
    const drawn = new Set([...iconBody.matchAll(/^\s{4}([a-z]+): </gm)].map((m) => m[1])); const named = new Set();
    for (const m of logicSrc.matchAll(/icon:([a-z]+)/g)) named.add(m[1]); for (const m of logicSrc.matchAll(/kind: 'icon', name: '([a-z]+)'/g)) named.add(m[1]);
    for (const id of Object.keys(L.GENERATORS)) for (let s = 1; s <= 30; s++) { let q; try { q = L.generateQuestion(id, s); } catch (e) { break; } for (const c of [...(q.choices || []), q.answer]) if (typeof c === 'string' && c.startsWith('icon:')) named.add(c.slice(5).split(/[:#]/)[0]); for (const v of [q.visual, q.explainVisual]) if (v && v.kind === 'icon') named.add(v.name); }
    const missing = [...named].filter((n) => !drawn.has(n));
    ok('every icon a lesson or question names has a drawing', named.size > 10 && missing.length === 0, missing.join(', '));
    ok('the moon is drawn as a crescent, not two arcs that cancel out', /moon: <path d="M66 16A34 34 0 0 0 66 84A40 40 0 0 1 66 16Z"/.test(iconBody));
  }
  { // Pass IT: lesson titles read naturally inside sentences.
    ok('a lesson title that starts with a doing word reads naturally', L.teachPhrase('Count to 10') === 'counting to 10' && L.goalPhrase('Count to 10') === 'how to count to 10' && L.teachPhrase('Spend, save and share') === 'spending, saving and sharing' && L.teachPhrase('Compare and contrast') === 'comparing and contrasting' && L.teachPhrase('Find the match') === 'finding the match');
    ok('question, sentence and topic titles read naturally too', L.goalPhrase('How plants grow') === 'how plants grow' && L.teachPhrase('Sound is a vibration') === 'that sound is a vibration' && L.goalPhrase('Shapes') === 'about shapes');
    ok('every lesson title gives a phrase that keeps a capital only for a name', L.COURSES.flatMap((c) => c.modules).every((m) => { const t = L.teachPhrase(m.title); const g = L.goalPhrase(m.title); return t && g && (!/^[A-Z][a-z]/.test(t) || L.lowerTitle(m.title).charAt(0) === m.title.charAt(0)) && !/  /.test(t + g); }) && L.teachPhrase('Big and small') === 'big and small' && L.lowerTitle('Big Bang') === 'Big Bang');
    const at = (d) => new Date(Date.now() - d * 86400000).toISOString();
    const rnd = (id, d, flags) => ({ type: 'attempt_completed', at: at(d), startedAt: at(d), moduleId: id, seed: d, core: flags.map((c) => ({ correct: c })), review: null, coreCorrect: flags.filter(Boolean).length, coreTotal: flags.length });
    const ids = L.COURSES.find((c) => c.id === 'counting-k').modules.slice(0, 3).map((m) => m.id);
    const note = L.weeklyNote('Sam', [L.makeCoursesEnabledEvent(['counting-k'], at(9)), rnd(ids[0], 3, [true, true, true, true, true]), rnd(ids[1], 2, [true, false, false, true, false]), rnd(ids[2], 1, [true, true, false, true, true])], new Date().toISOString());
    ok('the weekly note names each lesson once, each on its own line', ids.every((id) => note.split(L.getModule(id).title).length - 1 <= 1) && !note.includes('working on'), note.replace(/\n/g, ' / '));
  }
  const ev = L.makeWonderEvent('w-one-thing', 'fraction-meaning', '2026-09-04T10:00:00.000Z', 42, 12);
  ok('a Wonder event stores no words', !Object.values(ev).some((v) => typeof v === 'string' && v.split(' ').length > 3));
  ok('Wonder never affects mastery', L.deriveProgress([ev]).masteredIds.length === 0);
  ok('report counts reflections', L.buildReport('T', [ev]).reflections === 1);
}

// ---- 9. Grades and feature switches ----
{
  ok('every course names a grade the platform knows', L.COURSES.every((c) => L.GRADES.includes(c.grade)));
  ok('grade labels read plainly', L.gradeLabel('K') === 'Kindergarten' && L.gradeLabel('3') === 'Grade 3');
  ok('only grades that have courses are offered, in order', JSON.stringify(L.gradesWithCourses()) === '["PK3","PK4","K","1","2","3","4","5","6","7","8","9","10","11","12","C"]');
  const k = L.subjectsForGrade('K');
  // Health joined kindergarten on 2026-09-23; it sorts last.
  ok('kindergarten groups into Math, Reading, Science, History, Art, Technology, Health, Economics, Philosophy, Psychology, Speech, Agriculture and Business, in that order (business joined K in pass HH)', k.length === 13 && k[12].subject === 'Business' && k[0].subject === 'Math' && k[1].subject === 'Reading' && k[2].subject === 'Science' && k[3].subject === 'History' && k[4].subject === 'Art' && k[5].subject === 'Technology' && k[6].subject === 'Health' && k[7].subject === 'Economics' && k[8].subject === 'Philosophy' && k[9].subject === 'Psychology' && k[10].subject === 'Speech' && k[11].subject === 'Agriculture');
  ok('every grade now has courses', L.subjectsForGrade('PK3').length === 2);
  ok('science runs from kindergarten to grade 12', ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].every((g) => L.subjectsForGrade(g).some((x) => x.subject === 'Science')));
  ok('pre-K 3 is never a starter; a new early-years student begins at pre-K 4', L.recommendedCourseIds([L.makeCoursesEnabledEvent([], 't')], 'early').every((id) => L.getCourse(id).grade === 'PK4'));
  ok('every course in a grade group really belongs to that grade', L.gradesWithCourses().every((g) => L.subjectsForGrade(g).every((s) => s.courses.every((c) => c.grade === g))));
  ok('the optional sections have switches', ['reflection', 'lifeSkills', 'checks'].every((k2) => typeof L.FEATURES[k2] === 'boolean'));
}

// ---- 10. Roster: admins create the IDs, students only pick them ----
{
  let r = L.emptyRoster();
  ok('a new roster is empty', r.students.length === 0);
  ok('an empty ID is refused with a plain sentence', L.addStudent(r, '  ', 't', { level: 'elementary' }).error === 'Enter a student ID first.');
  r = L.addStudent(r, 'S-1042', '2026-09-05T10:00:00.000Z', { level: 'elementary' }).roster;
  ok('an ID becomes a safe key but keeps its readable label', r.students[0].id === 's_1042' && r.students[0].label === 'S-1042');
  ok('the same ID cannot be added twice', L.addStudent(r, 's-1042', 't', { level: 'elementary' }).error !== null);
  // A PIN is four digits chosen by the educator, or nothing; Wonder questions are on unless switched off.
  ok('a PIN must be four digits', L.cleanPin('1234') === '1234' && L.cleanPin('123') === null && L.cleanPin('12a4') === null && L.cleanPin('') === null);
  ok('a bad PIN while adding is refused with a plain sentence', L.addStudent(r, 'S-2', 't', { level: 'elementary', pin: '12' }).error === 'A PIN is 4 digits.');
  { const added = L.addStudent(r, 'S-2', 't', { level: 'elementary', pin: '4321', wonder: false }).roster; const st = L.findStudent(added, 'S-2');
    ok('a PIN and the Wonder switch are kept on the student', st.pin === '4321' && st.wonder === false && L.wonderOnFor(st) === false);
    ok('the right PIN opens the record and a wrong one does not', L.pinMatches(st, '4321') && !L.pinMatches(st, '0000') && L.pinMatches(L.findStudent(added, 'S-1042'), ''));
    ok('a PIN can be changed or removed, and Wonder switched back on', L.findStudent(L.setStudentPin(added, 'S-2', '9999'), 'S-2').pin === '9999' && L.findStudent(L.setStudentPin(added, 'S-2', null), 'S-2').pin === null && L.wonderOnFor(L.findStudent(L.setStudentWonder(added, 'S-2', true), 'S-2')));
    ok('Wonder questions are on for a student added without saying', L.wonderOnFor(L.findStudent(added, 'S-1042')));
  }
  // My Classroom order: youngest band first, then by name, unless an educator has dragged the cards.
  { const mk = (label, level, order) => ({ id: label.toLowerCase(), label, level, active: true, ...(order === undefined ? {} : { order }) });
    const list = [mk('Zed', 'early'), mk('Amy', 'middle'), mk('Bob', 'early'), mk('Cal', 'elementary')];
    ok('the classroom sorts by band, then name', L.classroomOrder(list).map((s) => s.label).join(' ') === 'Bob Zed Cal Amy');
    const dragged = L.setClassroomOrder({ version: 1, students: list }, ['cal', 'zed', 'bob', 'amy']).students;
    ok('a dragged order is kept, and a new student joins at the end', L.classroomOrder([...dragged, mk('New', 'early')]).map((s) => s.label).join(' ') === 'Cal Zed Bob Amy New');
  }
  r = L.addStudent(r, 'S-2001', 't', { level: 'elementary' }).roster;
  ok('renaming keeps the id, so progress cannot be lost', L.renameStudent(r, 'S-1042', 'Sam R.').roster.students[0].id === 's_1042' && L.renameStudent(r, 'S-1042', 'Sam R.').roster.students[0].label === 'Sam R.');
  ok('a blank name is refused', L.renameStudent(r, 'S-1042', ' ').error !== null);
  ok('a name of thirty characters fits', L.renameStudent(r, 'S-1042', 'Very Very Long Name (Grade 3)!').error === null && L.NAME_MAX === 30);
  ok('pre-K 3 has the two magic words as a module', L.getModule('please-and-thank-you') && L.generateQuestion('pk3-magic-word', 3).choices.length === 2);
  // Grade 7 carries every one of the TEKS 7.1B significant dates somewhere in its questions.
  { const years = new Set(); for (const m of L.getCourse('history-7').modules) for (const g of new Set(m.generators)) for (let seed = 1; seed <= 60; seed++) { const q = L.generateQuestion(g, seed); for (const y of (JSON.stringify([q.story, q.answer, q.choices]).match(/\b1[5-9]\d\d\b/g) || [])) years.add(y); }
    ok('grade 7 asks about all eight 7.1B dates: 1519, 1718, 1821, 1836, 1845, 1861, 1876, 1901', ['1519', '1718', '1821', '1836', '1845', '1861', '1876', '1901'].every((y) => years.has(y))); }
  // The same holds where the TEKS name points of reference: grade 8 (8.1B) and US history since 1877 (11.2B).
  { const yearsOf = (cid) => { const years = new Set(); for (const m of L.getCourse(cid).modules) for (const g of new Set(m.generators)) for (let seed = 1; seed <= 60; seed++) { const q = L.generateQuestion(g, seed); for (const y of (JSON.stringify([q.story, q.answer, q.choices]).match(/\b1[5-9]\d\d\b|\b20[0-2]\d\b/g) || [])) years.add(y); } return years; };
    const y8 = yearsOf('history-8'); const y11 = yearsOf('history-11');
    ok('grade 8 asks about all six 8.1B dates: 1607, 1620, 1776, 1787, 1803, 1861', ['1607', '1620', '1776', '1787', '1803', '1861'].every((y) => y8.has(y)));
    ok('grade 11 asks about all ten 11.2B turning points', ['1898', '1914', '1918', '1929', '1939', '1945', '1957', '1968', '1969', '1991', '2001', '2008'].every((y) => y11.has(y)));
    const y10 = new Set(); for (const m of L.getCourse('history-10').modules) for (const g of new Set(m.generators)) for (let seed = 1; seed <= 60; seed++) { const q = L.generateQuestion(g, seed); for (const y of (JSON.stringify([q.story, q.answer, q.choices]).match(/\b\d{3,4}\b/g) || [])) y10.add(y); }
    ok('grade 10 asks about a turn in every TEKS period: river valleys, classical, post-classical, connecting hemispheres, revolutions, the twentieth century', ['8000', '509', '476', '1347', '1492', '1760', '1914'].every((y) => y10.has(y))); }
  ok('every course with reference dates exists and lists at least six', Object.entries(L.REFERENCE_DATES).every(([cid, list]) => L.getCourse(cid) && list.length >= 6));
  ok('a name of thirty-one characters is refused with a plain sentence', L.renameStudent(r, 'S-1042', 'A'.repeat(31)).error === 'Names can be up to 30 characters.');
  ok('the same cap holds when a student is added', L.addStudent(r, 'B'.repeat(31), 't', { level: 'elementary' }).error === 'Names can be up to 30 characters.' && L.addStudent(r, 'B'.repeat(30), 't', { level: 'elementary' }).error === null);
  ok('subjects sort Math, Reading, Writing, Science, History, then the rest', L.sortSubjects(['History', 'Science', 'Art', 'Math', 'Writing', 'Reading', 'Math']).join(',') === 'Math,Reading,Writing,Science,History,Art');
  const hidden = L.setStudentActive(r, 'S-2001', false);
  ok('deactivating hides a student without deleting them', L.activeStudents(hidden).length === 1 && hidden.students.length === 2);
  const merged = L.mergeStudents(r, 'S-1042', 'S-2001');
  ok('merging keeps one student and marks the other', L.activeStudents(merged.roster).length === 1 && L.findStudent(merged.roster, 'S-2001').mergedInto === 's_1042');
  ok('merging a student with itself is refused', L.mergeStudents(r, 'S-1042', 'S-1042').error !== null);
  const a = [{ type: 'lesson_viewed', at: '2026-01-02T00:00:00.000Z', moduleId: 'x' }];
  const b = [{ type: 'lesson_viewed', at: '2026-01-01T00:00:00.000Z', moduleId: 'y' }];
  ok('merged event logs stay in time order and lose nothing', JSON.stringify(L.mergeEventLogs(a, b).map((e) => e.moduleId)) === '["y","x"]');
  // Starting levels and pictures
  ok('there are four starting levels covering pre-K to college', L.LEVELS.length === 4 && L.LEVELS[0].grades.includes('PK3') && L.LEVELS[3].grades.includes('C'));
  ok('only the early years ask for a picture', L.LEVELS.filter((l) => l.picture).map((l) => l.id).join() === 'early');
  const young = L.addStudent(L.emptyRoster(), 'S-9', 't', { level: 'early', picture: 'fox' }).roster.students[0];
  ok('a student can be added with a level and a picture', young.level === 'early' && young.picture === 'fox');
  ok('an unknown level is refused, a level is required', L.addStudent(L.emptyRoster(), 'S-8', 't', { level: 'genius' }).error === 'Choose a starting level first.');
  ok('an unknown picture is dropped rather than stored', L.addStudent(L.emptyRoster(), 'S-8', 't', { level: 'middle', picture: 'selfie.jpg' }).roster.students[0].picture === null);
  ok('a backup file name names the device, the count, the date and the time', /^wise-human-ipad-3-12-students-\d{1,2}-\d{1,2}-2026-\d{1,2}-\d{2}(am|pm)\.json$/.test(L.backupFileName('iPad 3', 12, '2026-09-10T15:00:00.000Z')));
  ok('a backup file says when it was saved in plain words, in the device\'s own time zone', /^[A-Z][a-z]+day, [A-Z][a-z]+ \d{1,2}, \d{4} at \d{1,2}:\d{2} [AP]M .+/.test(L.describeMoment('2026-09-12T05:35:00.000Z')) && L.buildBackup({ roster: { students: [] }, records: [], wonderReview: null, covered: [], deviceName: 'x', recovery: null }, '2026-09-12T05:35:00.000Z').saved === L.describeMoment('2026-09-12T05:35:00.000Z'));
  ok('the stamp reads month, day, year, then the time', L.backupStamp(new Date(2026, 8, 11, 22, 43).toISOString()) === '9-11-2026-10-43pm' && L.backupStamp(new Date(2026, 0, 5, 0, 7).toISOString()) === '1-5-2026-12-07am');
  ok('a missing device name still gives a sensible file name', /^wise-human-device-1-student-/.test(L.backupFileName('', 1, '2026-09-10T15:00:00.000Z')));
  ok('pictures are a fixed drawn set, never an upload', L.PICTURES.length === 12 && L.PICTURES.every((p) => /^[a-z]+$/.test(p)));
  ok('twelve animals and six colours give seventy-two pictures', L.PICTURES.length * L.TINTS.length === 72);
  let big = L.emptyRoster();
  for (let i = 0; i < 30; i++) { const f = L.firstFreePicture(big); big = L.addStudent(big, `K-${i}`, 't', { level: 'early', picture: f.picture, tint: f.tint }).roster; }
  const keys = big.students.map((st) => `${st.picture}:${st.tint}`);
  ok('thirty young students can each have a different picture', new Set(keys).size === 30);
  ok('a picture in use is reported as in use', L.pictureInUse(big, big.students[0].picture, big.students[0].tint) === true);
  ok('a hidden student frees their picture', L.pictureInUse(L.setStudentActive(big, 'K-0', false), big.students[0].picture, big.students[0].tint) === false);
  ok('a picture always carries a colour', big.students.every((st) => L.tintFor(st.tint) !== null));
  const withPic = L.setStudentPicture(L.addStudent(L.emptyRoster(), 'S-7', 't', { level: 'elementary' }).roster, 'S-7', 'owl');
  ok('a picture can be added later, with a default colour', L.findStudent(withPic, 'S-7').picture === 'owl' && L.findStudent(withPic, 'S-7').tint === 'sun');
  ok('a picture can be removed again', L.findStudent(L.setStudentPicture(withPic, 'S-7', null), 'S-7').picture === null);
  ok('a level narrows recommendations to its band', JSON.stringify(L.recommendedCourseIds([L.makeCoursesEnabledEvent([], 't')], 'early')) === '["first-steps-pk","first-sounds-pk"]');
  // The band under a name on the login screen only moves up when everything below it is mastered.
  { const early = L.getCourse('counting-k').modules.map((m) => m.id);
    const assigned = [L.makeCoursesEnabledEvent(['counting-k', 'fractions-intro'], '2026-09-15T09:00:00.000Z')];
    ok('a student with early years work unfinished reads Early years', L.bandTitle(assigned) === 'Early years');
    // Two clean passes on different days master a module; the same for every early years module.
    const pass = (id, at) => ({ type: 'attempt_completed', at, startedAt: at, moduleId: id, seed: 1, core: Array.from({ length: L.moduleRules(id).questions }, () => ({ correct: true, timeMs: 9000 })), review: null, coreCorrect: L.moduleRules(id).questions, coreTotal: L.moduleRules(id).questions });
    const finished = [...assigned, ...early.flatMap((id, i) => [pass(id, `2026-09-${10 + (i % 5)}T10:00:00.000Z`), pass(id, `2026-09-${20 + (i % 5)}T10:00:00.000Z`)])];
    ok('it reads Elementary once every early years module is mastered', L.bandTitle(finished) === 'Elementary');
    ok('a student with no early years work assigned reads Elementary at once', L.bandTitle([L.makeCoursesEnabledEvent(['fractions-intro'], 't')]) === 'Elementary');
    ok('the college course reads College, and nothing assigned reads nothing', L.bandTitle([L.makeCoursesEnabledEvent(['history-college'], 't')]) === 'College' && L.bandTitle([L.makeCoursesEnabledEvent([], 't')]) === ''); }
  // Coloring is play: one picture from the start, another for every course finished, and it is never a module.
  { const ev = [L.makeCoursesEnabledEvent(['counting-k'], '2026-09-15T09:00:00.000Z')];
    ok('one coloring picture is there from the start', L.coloringUnlocked(ev) === 1);
    const passes = L.getCourse('counting-k').modules.flatMap((m, i) => { const at = `2026-09-${10 + (i % 5)}T10:00:00.000Z`; const n = L.moduleRules(m.id).questions; return [{ type: 'attempt_completed', at, startedAt: at, moduleId: m.id, seed: 1, core: Array.from({ length: n }, () => ({ correct: true, timeMs: 9000 })), review: null, coreCorrect: n, coreTotal: n }]; });
    ok('every module passed adds one', L.coloringUnlocked([...ev, ...passes]) === 1 + L.getCourse('counting-k').modules.length);
    ok('a coloring picture is never a module and never a course, and there are plenty', !L.MODULES.some((m) => L.COLORING_PICTURES.includes(m.id)) && L.COLORING_PICTURES.length >= 20 && L.COLORING_PICTURES[0] === 'ball'); }
  // A module passed today is waiting for another day: a young learner's screen sets it aside until then.
  { const n = L.moduleRules('count-to-5').questions;
    const pass = (at) => ({ type: 'attempt_completed', at, startedAt: at, moduleId: 'count-to-5', seed: 1, core: Array.from({ length: n }, () => ({ correct: true, timeMs: 9000 })), review: null, coreCorrect: n, coreTotal: n });
    const once = [L.makeCoursesEnabledEvent(['counting-k'], '2026-09-16T08:00:00.000Z'), pass('2026-09-16T09:00:00.000Z')];
    ok('a module passed today waits for another day', L.waitingForAnotherDay(once, 'count-to-5', '2026-09-16T18:00:00.000Z'));
    ok('the next day it is back to be passed again', !L.waitingForAnotherDay(once, 'count-to-5', '2026-09-17T08:00:00.000Z'));
    ok('a module never passed is not waiting, and a mastered one is done', !L.waitingForAnotherDay(once, 'count-to-10', '2026-09-16T18:00:00.000Z') && !L.waitingForAnotherDay([...once, pass('2026-09-17T09:00:00.000Z')], 'count-to-5', '2026-09-17T18:00:00.000Z')); }
  // A coloring break is noted for the educator, and stays out of progress and the transcript.
  { const ev = [L.makeCoursesEnabledEvent(['counting-k'], '2026-09-16T09:00:00.000Z'), L.makeColoredEvent('house', '2026-09-16T10:00:00.000Z'), L.makeColoredEvent('star', '2026-09-16T10:30:00.000Z')];
    ok('coloring breaks are counted for the report', L.coloringBreaks(ev) === 2 && L.buildReport('S-8', ev).coloringBreaks === 2);
    ok('a coloring break is no kind of progress', L.deriveProgress(ev).masteredIds.length === 0 && L.deriveProgress(ev).passedIds.length === 0 && L.buildReport('S-8', ev).totalAttempts === 0);
    ok('the transcript never mentions coloring', !JSON.stringify(L.buildTranscript('S-8', ev)).toLowerCase().includes('color')); }
  // Pre-K is grouped by skill on the student's screen; every skill named is one the order knows.
  { const preK = L.COURSES.filter((c) => c.grade === 'PK3' || c.grade === 'PK4').flatMap((c) => c.modules);
    ok('every pre-K module names the skill it practises', preK.every((m) => m.skill && L.SKILL_ORDER.includes(m.skill)));
    const preKIds = new Set(preK.map((m) => m.id));
    ok('no other module carries a skill label', !L.MODULES.filter((m) => !preKIds.has(m.id)).some((m) => m.skill)); }
  ok('an elective is never recommended, only offered under other courses', !L.recommendedCourseIds([L.makeCoursesEnabledEvent([], 't')], 'elementary').some((id) => L.getCourse(id).elective) && L.COURSES.some((c) => c.elective));
  ok('a high school student starts on the grade 9 courses', JSON.stringify(L.recommendedCourseIds([L.makeCoursesEnabledEvent([], 't')], 'high')) === '["history-9","math-9","reading-9","science-9","writing-9"]');
  ok('the letters course and now the counting course both have a touch module', L.courseNeedsTouch('letters-k') === true && L.courseNeedsTouch('counting-k') === true && L.courseNeedsTouch('fractions-intro') === false);
  ok('a wobbly hand passes, a wrong letter and a scribble do not', L.traceMatches('L', [[[34, 16], [31, 42], [28, 63], [33, 84]], [[31, 88], [52, 83], [74, 86]]]) && !L.traceMatches('L', [[[30, 15], [75, 15]], [[50, 15], [50, 85]]]) && !L.traceMatches('L', [Array.from({ length: 80 }, (_, i) => [(i * 37) % 100, (i * 53) % 100])]));
}

// ---- 11. Resetting one module without touching the others ----
{
  const att = (moduleId, at) => ({ type: 'attempt_completed', at, startedAt: at, moduleId, seed: 1, core: [], review: null, coreCorrect: 5, coreTotal: 5 });
  const events = [att('fraction-meaning', '2026-09-01T10:00:00.000Z'), att('count-to-5', '2026-09-01T11:00:00.000Z')];
  const before = L.deriveProgress(events);
  ok('both modules start out mastered', before.masteredIds.includes('fraction-meaning') && before.masteredIds.includes('count-to-5'));
  const after = L.deriveProgress([...events, L.makeModuleResetEvent('count-to-5', '2026-09-02T10:00:00.000Z')]);
  ok('resetting one module clears only that one', after.masteredIds.includes('fraction-meaning') && !after.masteredIds.includes('count-to-5'));
  ok('a module reset clears its attempt count too', after.perModule['count-to-5'].attempts === 0 && after.perModule['fraction-meaning'].attempts === 1);
  const redone = L.deriveProgress([...events, L.makeModuleResetEvent('count-to-5', '2026-09-02T10:00:00.000Z'), att('count-to-5', '2026-09-03T10:00:00.000Z')]);
  ok('practice after a module reset counts again', redone.masteredIds.includes('count-to-5'));
  ok('nothing is deleted by a reset', [...events, L.makeModuleResetEvent('count-to-5', 't')].length === 3);
  // The prerequisite graph
  ok('the second module in a course needs the first', JSON.stringify(L.prerequisitesOf('count-to-10')) === '["count-to-5"]');
  ok('the first module in a course needs nothing, unless it names something', L.prerequisitesOf('colours').length === 0 && JSON.stringify(L.prerequisitesOf('count-to-5')) === '["count-to-3"]');
  ok('the graph has no missing links and no loops', L.checkPrerequisiteGraph().length === 0);
  ok('a non-linear course does not chain its modules', L.prerequisitesOf('count-to-3').length === 0 && JSON.stringify(L.prerequisitesOf('patterns')) === '["same-and-different"]');
  // A student placed at grade 3 without grade 2 is not locked out of grade 3 reading
  { const fresh = L.deriveProgress([]);
    const placed = L.moduleStatuses(fresh, ['reading-3', 'fractions-intro', 'multiplication-3']);
    ok('a first module whose only prerequisite lives in an unassigned course opens', placed.find((x) => x.id === 'main-idea').status === 'available');
    ok('the same module stays locked when the earlier course is assigned too', L.moduleStatuses(fresh, ['reading-2', 'reading-3']).find((x) => x.id === 'main-idea').status === 'locked');
    ok('in-course chains still hold', placed.find((x) => x.id === 'fact-or-opinion').status === 'locked');
    ok('without an assignment list every prerequisite gates, as before', L.moduleStatuses(fresh).find((x) => x.id === 'main-idea').status === 'locked'); }
  const fresh = L.deriveProgress([]);
  ok('only first modules are open to a brand new student', L.moduleStatuses(fresh).filter((s) => s.status === 'available').every((s) => L.prerequisitesOf(s.id).length === 0));
}

// ---- 12. The plain-English summary describes everything assigned at once ----
{
  const att = (moduleId, at, correct) => ({ type: 'attempt_completed', at, startedAt: at, moduleId, seed: 1, core: [], review: null, coreCorrect: correct, coreTotal: 5 });
  const rep = L.buildReport('Sam R.', [att('count-to-5', '2026-09-01T10:00:00.000Z', 5)]);
  const text = L.summaryParagraph(rep);
  ok('the summary opens with the readable name', text.startsWith('Sam R. has mastered'));
  ok('it counts every assigned course, not one grade at a time', text.includes('1 of 14 in Kindergarten math') && text.includes('in third grade math') && text.includes('pre-K 4 math') && text.includes('first grade math'));
  ok('grades are spoken the way a person would say them', text.includes('Kindergarten') && text.includes('third grade') && !text.includes('Grade 3'));
  ok('confidence is described in words, never as a raw score', /Confidence is strongest|ground to make up|steady across the board|not been enough practice/.test(text) && !/score of \d|\d out of 5/.test(text));
  ok('reflections are reported in a plain sentence', text.includes('No reflection questions have been answered yet'));
  const noneOn = L.buildReport('Sam', [L.makeCoursesEnabledEvent([], '2026-09-01T09:00:00.000Z')]);
  ok('a student with nothing switched on is told so plainly', L.summaryParagraph(noneOn).includes('no courses switched on yet'));
  ok('the summary agrees with the report it came from', text.includes(`${rep.modules.filter((m) => m.courseId === 'counting-k' && m.mastered).length} of 14`));
}

// ---- 13. Course labels and the recommended list ----
{
  ok('an elective band shows its short names: Kinder on a fold, KG in a row', L.electiveBand('K').title === 'Kinder to Grade 2' && L.courseLabel(L.getCourse('speech-k')).includes('(KG to Grade 2 - Speech)') && L.courseGradeLabel(L.getCourse('speech-k')) === 'Kinder to Grade 2' && L.courseLabel(L.getCourse('speech-3')).includes('(Grades 3 to 5 - Speech)'));
  ok('a course label leads with its name', L.courseLabel(L.getCourse('fractions-intro')) === 'Fractions (Grade 3 - Math)');
  ok('kindergarten is abbreviated', L.courseLabel(L.getCourse('counting-k')) === 'Counting (KG - Math)');
  ok('grades read naturally in a sentence', L.gradeInSentence('K') === 'Kindergarten' && L.gradeInSentence('3') === 'third grade');
  ok('a brand new student is recommended the earliest grade only', L.recommendedCourseIds([L.makeCoursesEnabledEvent([], 't')]).every((id) => L.getCourse(id).grade === 'PK4'));
  const rec = L.recommendedCourseIds([L.makeCoursesEnabledEvent(['fractions-intro'], 't')]);
  ok('recommendations follow the grade a student is working in', rec.includes('fractions-intro') && !rec.includes('counting-k'));
  ok('every course is either recommended or optional, never both or neither', L.COURSES.every((c) => rec.includes(c.id) || !rec.includes(c.id)));
}

// ---- 14. Per-module mastery rules and the transcript ----
{
  ok('a module with no override uses the platform default', L.moduleRules('count-to-5').questions === L.CONFIG.CORE_QUESTIONS_PER_ATTEMPT && L.moduleRules('count-to-5').toMaster === L.CONFIG.MASTERY_MIN_CORRECT);
  ok('an unknown module still returns sensible rules', L.moduleRules('nope').questions === L.CONFIG.CORE_QUESTIONS_PER_ATTEMPT);
  const att = (moduleId, at, correct, total) => ({ type: 'attempt_completed', at, startedAt: at, moduleId, seed: 1, core: [], review: null, coreCorrect: correct, coreTotal: total || 5 });
  const events = [att('count-to-5', '2026-09-01T10:00:00.000Z', 5), att('count-to-10', '2026-09-02T10:00:00.000Z', 5), att('tracing-numbers', '2026-09-02T10:30:00.000Z', 5), att('tracing-shapes', '2026-09-02T10:40:00.000Z', 5), att('one-more-one-less', '2026-09-02T11:00:00.000Z', 5), att('joining-and-taking-away', '2026-09-02T12:00:00.000Z', 5), att('comparing-numbers', '2026-09-02T13:00:00.000Z', 5), att('shapes', '2026-09-02T14:00:00.000Z', 5), att('counting-by-tens', '2026-09-02T15:00:00.000Z', 5), att('longer-and-heavier', '2026-09-02T16:00:00.000Z', 5), att('sorting', '2026-09-02T17:00:00.000Z', 5), att('solids', '2026-09-02T18:00:00.000Z', 5), att('making-ten', '2026-09-02T19:00:00.000Z', 5), att('more-and-fewer-10', '2026-09-02T19:30:00.000Z', 5), att('fraction-meaning', '2026-09-03T10:00:00.000Z', 2)];
  const tr = L.buildTranscript('S-1042', events);
  ok('a course with every module mastered is listed as completed', tr.completed.length === 1 && tr.completed[0].id === 'counting-k');
  ok('a course part way through is listed separately', tr.inProgress.length === 1 && tr.inProgress[0].id === 'fractions-intro');
  ok('a course never opened is left off the transcript entirely', ![...tr.completed, ...tr.inProgress].some((c) => c.id === 'letters-k'));
  ok('the transcript records when a course was completed', typeof tr.completed[0].completedAt === 'string');
  ok('the transcript keeps courses that are no longer switched on', L.buildTranscript('S', [...events, L.makeCoursesEnabledEvent([], '2026-09-04T10:00:00.000Z')]).completed.length === 1);
  ok('a course switched off is marked as such', L.buildTranscript('S', [...events, L.makeCoursesEnabledEvent([], '2026-09-04T10:00:00.000Z')]).completed[0].stillAssigned === false);
  ok('transcript courses run beginner to advanced', L.buildTranscript('S', [att('count-to-5', 't1', 5), att('fraction-meaning', 't2', 5)]).inProgress.every((c, i, list) => i === 0 || L.GRADES.indexOf(list[i - 1].grade) <= L.GRADES.indexOf(c.grade)));
  ok('the transcript states plainly that it holds no personal information', tr.note.includes('no personal information'));
  ok('the transcript carries nothing a student wrote', JSON.stringify(tr).includes('wonder_answered') === false);
}

// ---- 15. Life skills: an ordered sequence rather than a grade assignment ----
{
  const ordered = L.lifeSkillsInOrder();
  ok('every skill is in the sequence', ordered.length === L.LIFE_SKILLS.length && ordered.length >= 30);
  ok('the first skill is the earliest and the last is the most mature', ordered[0].maturity === 0 && ordered[ordered.length - 1].maturity === 1);
  ok('maturity only ever rises down the list', ordered.every((sk, i) => i === 0 || sk.maturity >= ordered[i - 1].maturity));
  ok('positions are numbered from one', ordered[0].position === 1 && ordered[ordered.length - 1].position === ordered.length);
  ok('no skill is pinned to a grade any more', L.LIFE_SKILLS.every((sk) => sk.grade === undefined));
  ok('every skill says what it is, why it matters and how to practice it', L.LIFE_SKILLS.every((sk) => sk.title && sk.why.length > 40 && sk.ways.length >= 3));
  ok('no life skill text uses an em dash', L.LIFE_SKILLS.every((sk) => !sk.why.includes('\u2014') && sk.ways.every((w) => !w.includes('\u2014'))));
  ok('the earliest skill is simple and the last is grown up', ordered[0].title === 'Riding a bike' && ordered[ordered.length - 1].title === 'Working out what matters to you');
  ok('every stage has skills in it', L.LIFE_STAGES.every((st) => ordered.some((sk) => sk.stage === st.id)));
  ok('every id is unique', new Set(L.LIFE_SKILLS.map((sk) => sk.id)).size === L.LIFE_SKILLS.length);
  ok('life skills can be switched off entirely', typeof L.FEATURES.lifeSkills === 'boolean');
  ok('there are four stage markers down the sequence', L.LIFE_STAGES.length === 4 && L.LIFE_STAGES[0].id === 'early' && L.LIFE_STAGES[3].id === 'grown');
  ok('every skill belongs to a stage the platform knows', ordered.every((sk) => L.LIFE_STAGES.some((st) => st.id === sk.stage)));
  ok('stages never run backwards down the list', ordered.every((sk, i) => i === 0 || L.LIFE_STAGES.findIndex((st) => st.id === sk.stage) >= L.LIFE_STAGES.findIndex((st) => st.id === ordered[i - 1].stage)));
  const none = L.emptyCoveredSkills();
  ok('nothing is covered to begin with', none.covered.length === 0 && L.coveredCount(none, ordered) === 0);
  const one = L.toggleCovered(none, 'ls-bike');
  ok('a skill can be marked as covered', L.isCovered(one, 'ls-bike') && L.coveredCount(one, ordered) === 1);
  ok('marking it again puts it back', L.isCovered(L.toggleCovered(one, 'ls-bike'), 'ls-bike') === false);
  ok('covered marks belong to the classroom, never to a student', !JSON.stringify(one).includes('learner') && !JSON.stringify(one).includes('student'));
}

// ---- 16. Words for people: the module story and the learner encouragement ----
{
  const core = (n, ok, ms) => Array.from({ length: n }, (_, i) => ({ correct: i < ok, timeMs: ms }));
  const att = (id, at, ok, ms) => ({ type: 'attempt_completed', at, startedAt: at, moduleId: id, seed: 1, core: core(5, ok, ms), review: null, coreCorrect: ok, coreTotal: 5 });
  const ev = [
    { type: 'lesson_viewed', at: '2026-09-01T09:00:00.000Z', moduleId: 'count-to-5' },
    att('count-to-5', '2026-09-01T10:00:00.000Z', 3, 9000),
    att('count-to-5', '2026-09-02T10:00:00.000Z', 4, 2500),
    att('fraction-meaning', '2026-09-03T10:00:00.000Z', 5, 9500),
  ];
  const story = L.moduleStory('Sam', ev, 'count-to-5');
  ok('the story opens with reads and practices in words', story.startsWith('Sam read through this lesson once and practiced it twice.'));
  ok('each attempt is narrated with its score', story.includes('3 out of 5') && story.includes('4 out of 5'));
  ok('a suspiciously quick final round is called out against their usual pace', story.includes('noticeably quicker than the 9.5 seconds'));
  ok('a quick round triggers a promise to re-check later', story.includes('introduced again at a later time'));
  ok('the story ends with the confidence score', /confidence score in count to 5 currently stands at \d out of 5/.test(story));
  ok('no em dashes in the story', !story.includes('\u2014'));
  ok('an untouched module says so plainly', L.moduleStory('Sam', [], 'count-to-10').includes('has not opened'));
  ok('a read-only module says nothing counts yet', L.moduleStory('Sam', [{ type: 'lesson_viewed', at: 't', moduleId: 'count-to-10' }], 'count-to-10').includes('has not practiced it yet'));
  ok('encouragement names what was mastered and what is next', L.encouragementFor(ev, 'count-to-5', true) === 'You have mastered **count to 5!** Way to go!\nNext up is **count to 10.**');
  const wholeCourse = ['count-to-5', 'count-to-10', 'tracing-numbers', 'one-more-one-less', 'tracing-shapes', 'joining-and-taking-away', 'comparing-numbers', 'shapes', 'counting-by-tens', 'longer-and-heavier', 'sorting', 'solids', 'making-ten', 'more-and-fewer-10'].map((id, i) => att(id, `t${i}`, 5, 9000));
  ok('finishing a course points at the next course', L.encouragementFor(wholeCourse, 'making-ten', true).includes('Next we will learn about'));
  ok('a miss is met with encouragement, not a score', !L.encouragementFor(ev, 'count-to-5', false).includes('out of'));
}

// ---- 17. Backup files: the whole classroom in one file, restore never loses anything ----
{
  const roster = L.addStudent(L.emptyRoster(), 'S-1', 't1', { level: 'elementary' }).roster;
  const records = [{ name: 's_1', events: [{ type: 'lesson_viewed', at: '2026-09-01T10:00:00.000Z', moduleId: 'count-to-5' }] }];
  const state = { roster, records, wonderReview: L.emptyWonderReview(), covered: L.emptyCoveredSkills() };
  const file = L.buildBackup(state, '2026-09-02T00:00:00.000Z');
  ok('a backup names the app and a version and carries every record', file.app === 'The Wise Human' && file.version === 1 && file.records.length === 1);
  ok('a random file is refused with a plain sentence', L.checkBackup({ hello: 1 }) === 'That file is not a backup from The Wise Human.');
  ok('a backup from the future is refused rather than misread', L.checkBackup({ ...file, version: 99 }).includes('newer version'));
  ok('a good backup passes the check', L.checkBackup(file) === null);
  // Restore onto an empty device
  const empty = { roster: L.emptyRoster(), records: [], wonderReview: L.emptyWonderReview(), covered: L.emptyCoveredSkills() };
  const restored = L.mergeBackup(empty, file);
  ok('restoring onto an empty device recreates the classroom', restored.roster.students.length === 1 && restored.records[0].events.length === 1 && restored.addedStudents === 1);
  // Restore onto a device that has moved on since the backup was taken
  const later = { ...state, records: [{ name: 's_1', events: [...records[0].events, { type: 'lesson_viewed', at: '2026-09-03T10:00:00.000Z', moduleId: 'count-to-5' }] }] };
  const merged = L.mergeBackup(later, file);
  ok('restoring an old backup never loses newer work', merged.records[0].events.length === 2);
  ok('restoring twice adds nothing twice', L.mergeBackup(merged, file).records[0].events.length === 2);
  ok('educator settings take the union', L.mergeBackup({ ...empty, wonderReview: L.approveWonder(L.emptyWonderReview(), 'w-one-thing') }, file).wonderReview.approved.includes('w-one-thing'));
  ok('days since backup is counted in whole days', L.daysSinceBackup('2026-09-01T00:00:00.000Z', '2026-09-04T12:00:00.000Z') === 3 && L.daysSinceBackup(null, 'now') === null);
  // A backup proves ownership of the classroom, which is what a PIN reset requires
  const code = L.makeRecoveryCode(12345);
  ok('a recovery code is four groups of four digits', /^\d{4}-\d{4}-\d{4}-\d{4}$/.test(code) && L.makeRecoveryCode(12345) === code);
  const owned = L.buildBackup({ ...state, recovery: code }, '2026-09-02T00:00:00.000Z');
  ok('a backup made by this classroom proves ownership', L.backupProvesOwnership(owned, code));
  ok('a backup from another classroom does not', !L.backupProvesOwnership(L.buildBackup({ ...state, recovery: L.makeRecoveryCode(999) }, 't'), code));
  ok('an old backup with no code does not, and nothing crashes', !L.backupProvesOwnership(file, code) && !L.backupProvesOwnership(owned, null));
  ok('the recovery code is the first thing in the file after the app name', Object.keys(owned)[1] === 'recovery' && /RECOVERY CODE/.test(owned.recoveryNote));
  ok('a typed code matches with or without dashes and spaces', L.codeMatches(code, code) && L.codeMatches(code.replace(/-/g, ' '), code) && L.codeMatches(code.replace(/-/g, ''), code));
  ok('a wrong or short typed code does not match', !L.codeMatches('1234', code) && !L.codeMatches(code.slice(0, 15) + '0', code));
}

// ---- 18. Loop-back routing: two failed rounds send a student back to the prerequisite ----
{
  const att = (id, at, ok) => ({ type: 'attempt_completed', at, startedAt: at, moduleId: id, seed: 1, core: [], review: null, coreCorrect: ok, coreTotal: 5 });
  const passed = [att('count-to-5', '2026-09-01T10:00:00.000Z', 5)];
  const oneMiss = [...passed, att('count-to-10', '2026-09-02T10:00:00.000Z', 2)];
  const twoMiss = [...oneMiss, att('count-to-10', '2026-09-03T10:00:00.000Z', 1)];
  ok('one miss is not enough to route back', L.loopBackTarget(oneMiss, 'count-to-10') === null);
  ok('two misses in a row route back to the prerequisite', L.loopBackTarget(twoMiss, 'count-to-10') === 'count-to-5');
  ok('the failed streak counts only since the last pass', L.failedStreak(twoMiss, 'count-to-10') === 2 && L.failedStreak([...twoMiss, att('count-to-10', 't4', 5)], 'count-to-10') === 0);
  ok('re-passing the prerequisite clears the routing', L.loopBackTarget([...twoMiss, att('count-to-5', '2026-09-04T10:00:00.000Z', 5)], 'count-to-10') === null);
  ok('a module with no prerequisite never routes back', L.loopBackTarget([att('colours', 't1', 1), att('colours', 't2', 1)], 'colours') === null);
  const loop = L.makeLoopBackEvent('count-to-10', 'count-to-5', '2026-09-03T11:00:00.000Z');
  ok('a loop back is recorded as an event, never a deletion', loop.type === 'looped_back' && loop.moduleId === 'count-to-10' && loop.toModuleId === 'count-to-5');
  ok('the module story tells the educator about the loop back', L.moduleStory('Sam', [...twoMiss, loop], 'count-to-10').includes('Sam was sent back to count to 5'));
  ok('a loop back event does not disturb mastery counts', L.deriveProgress([...twoMiss, loop]).masteredIds.includes('count-to-5'));
}

// ---- 18b. The quick check: one module, five questions, placed but never mastered ----
{
  const at = '2026-09-14T10:00:00.000Z';
  const events = [L.makeCoursesEnabledEvent(['history-8'], '2026-09-14T09:00:00.000Z')];
  const check = L.buildQuickCheck('founding-documents', 7);
  ok('a quick check is five questions from the module, one per generator slot, no lesson', check.quickCheck && check.core.length === 5 && check.core.every((q) => q.fromModuleId === 'founding-documents') && check.review === null);
  ok('the same seed gives the same check', JSON.stringify(L.buildQuickCheck('founding-documents', 7).core.map((q) => q.prompt)) === JSON.stringify(check.core.map((q) => q.prompt)));
  ok('the next module offers it; a spoken course and Writing never do', L.quickCheckAllowed(events, 'founding-documents') && !L.quickCheckAllowed(events, 'count-to-5') && !L.quickCheckAllowed(events, L.COURSES.find((c) => c.subject === 'Writing').modules[0].id));
  const res = (n, ms) => Array.from({ length: 5 }, (_, i) => ({ correct: i < n, timeMs: ms }));
  const passEv = L.makeQuickCheckEvent('founding-documents', res(4, 9000), at);
  ok('four of five at a normal pace passes', passEv.type === 'quick_check' && passEv.passed && passEv.right === 4 && !passEv.guessed);
  ok('three of five does not pass', !L.makeQuickCheckEvent('founding-documents', res(3, 9000), at).passed);
  const rushed = L.makeQuickCheckEvent('founding-documents', res(5, 900), at);
  ok('five of five with every answer under two seconds is too fast to count', rushed.guessed && !rushed.passed);
  const placed = L.makeQuickPlacedEvent('founding-documents', at);
  const after = [...events, passEv, placed];
  const p = L.deriveProgress(after).perModule['founding-documents'];
  ok('a passed check places the module: passed for gating, never mastered', p.placed && p.passed && !p.mastered && L.moduleStatuses(L.deriveProgress(after), ['history-8']).find((x) => x.id === 'early-republic').status === 'available');
  ok('a quick-check placement never counts as the placement check for the subject', !L.placementDone(after, 'History'));
  ok('the link is one try per module', !L.quickCheckAllowed(after, 'founding-documents') && !L.quickCheckAllowed([...events, L.makeQuickCheckEvent('founding-documents', res(2, 9000), at)], 'founding-documents'));
  ok('the report row and the module story tell the educator', L.buildReport('S-9', after).modules.find((m) => m.id === 'founding-documents').quickCheck.right === 4 && L.moduleStory('S-9', after, 'founding-documents').includes('took the quick check') && L.moduleStory('S-9', after, 'founding-documents').includes('4 of 5'));
  const missStory = L.moduleStory('S-9', [...events, L.makeQuickCheckEvent('founding-documents', res(2, 9000), at), { type: 'attempt_completed', at: '2026-09-14T11:00:00.000Z', startedAt: '2026-09-14T11:00:00.000Z', moduleId: 'founding-documents', seed: 1, core: res(5, 8000), review: null, coreCorrect: 5, coreTotal: 5 }], 'founding-documents');
  ok('a missed check is named in the story and never counts as a miss for the loop back', missStory.includes('first tried the quick check') && L.failedStreak([...events, L.makeQuickCheckEvent('founding-documents', res(2, 9000), at)], 'founding-documents') === 0);
}

// ---- 18c. Teacher notes: on the log, so they survive resets and ride in backups ----
{
  const at = '2026-09-15T10:00:00.000Z';
  const note = L.makeNoteEvent('  Reads well aloud; shy in groups.  ', at);
  const events = [L.makeCoursesEnabledEvent(['history-8'], '2026-09-15T09:00:00.000Z'), note];
  ok('a note is an event with its text trimmed', note.type === 'note' && note.text === 'Reads well aloud; shy in groups.' && L.teacherNotes(events).length === 1 && L.teacherNotes(events)[0].text === note.text);
  ok('the report carries the notes, newest first', L.buildReport('S-6', [...events, L.makeNoteEvent('Second', '2026-09-16T10:00:00.000Z')]).notes.map((n) => n.text).join('|') === 'Second|Reads well aloud; shy in groups.');
  ok('a removed note is gone from the report and its removal stays on the log', L.buildReport('S-6', [...events, L.makeNoteRemovedEvent(note.noteId, '2026-09-16T10:00:00.000Z')]).notes.length === 0);
  // An edit is the old note removed and a new one written, in one save: the log keeps both, the report shows one.
  const edited = [...events, L.makeNoteRemovedEvent(note.noteId, '2026-09-16T09:00:00.000Z'), L.makeNoteEvent('Reads well aloud; joining group work now.', '2026-09-16T09:00:00.000Z')];
  ok('an edited note replaces the old one on the report and leaves both events on the log', L.teacherNotes(edited).length === 1 && L.teacherNotes(edited)[0].text === 'Reads well aloud; joining group work now.' && edited.filter((e) => e.type === 'note').length === 2);
  ok('a reset keeps the notes', L.teacherNotes([...events, L.makeResetEvent ? L.makeResetEvent('2026-09-17T10:00:00.000Z') : { type: 'reset', at: '2026-09-17T10:00:00.000Z' }]).length === 1);
}

// ---- 19. The class view: most in need first, reasons in words ----
{
  const att = (id, at, ok, ms) => ({ type: 'attempt_completed', at, startedAt: at, moduleId: id, seed: 1, core: Array.from({ length: 5 }, (_, i) => ({ correct: i < ok, timeMs: ms })), review: null, coreCorrect: ok, coreTotal: 5 });
  const students = [
    { id: 's_1', label: 'S-1', events: [att('count-to-5', '2026-09-01T10:00:00.000Z', 5, 6000), att('count-to-10', '2026-09-02T10:00:00.000Z', 2, 2000), att('count-to-10', '2026-09-03T10:00:00.000Z', 1, 2000)] },
    { id: 's_2', label: 'S-2', events: [att('count-to-5', '2026-09-09T10:00:00.000Z', 5, 6000)] },
    { id: 's_3', label: 'S-3', events: [] },
  ];
  const rows = L.classView(students, '2026-09-10T12:00:00.000Z');
  ok('the student who is stuck and guessing comes first', rows[0].label === 'S-1' && rows[0].band === 'needs help now');
  // Connect the dots is joined in order: the same points touched out of sequence is not the exercise.
  { const inOrder = [[[22, 22], [50, 22], [78, 22], [78, 50], [78, 78], [50, 78], [22, 78], [22, 50], [22, 22]]];
    const outOfOrder = [[[22, 22], [22, 78], [78, 78], [78, 22], [22, 22], [50, 22], [78, 50], [50, 78], [22, 50]]];
    ok('a square joined in order is accepted', L.traceMatches('square', inOrder));
    ok('the same dots joined backwards is not', !L.traceMatches('square', outOfOrder)); }
  ok('a student who has not started is flagged, gently', rows.find((r) => r.label === 'S-3').reasons.some((x) => x.endsWith('has not started')));
  // One failed round, nothing else: the row says so instead of "nothing to flag" (Mikey's test student, 2026-09-14).
  const oneMiss = { id: 's_4', label: 'S-4', events: [att('count-to-5', '2026-09-09T10:00:00.000Z', 2, 6000)] };
  const missRow = L.classView([oneMiss], '2026-09-10T12:00:00.000Z')[0];
  ok('one missed round is named, with its score, and what a second miss would bring', missRow.reasons.some((r) => r.includes('S-4 failed the last round of **Count to 5** (2 of 5 right, 1 attempt)') && r.includes('second miss')));
  ok('a class row names the stage the student is working in, without disturbing its attention band', rows.every((r) => typeof r.stage === 'string') && rows.every((r) => ['needs help now', 'keep an eye on', 'on track'].includes(r.band)));
  ok('the next module is named, not stringified', rows.every((r) => !r.nextTitle.includes('[object')) && rows.some((r) => r.nextTitle.length > 0));
  ok('every class row carries the practice line the report summary shows', missRow.practice === 'Practice so far: 1 round, 0 passed.\nTried but not passed yet: **Count to 5** (best score 2 out of 5, 1 attempt).' && rows.find((r) => r.label === 'S-3').practice === '');
  const quickEvents = [L.makeCoursesEnabledEvent(['history-8'], '2026-09-09T09:00:00.000Z'), L.makeQuickCheckEvent('founding-documents', Array.from({ length: 5 }, (_, i) => ({ correct: i < 2, timeMs: 9000 })), '2026-09-09T10:00:00.000Z')];
  const quickRow = L.classView([{ id: 's_5', label: 'S-5', events: quickEvents }], '2026-09-10T12:00:00.000Z')[0];
  ok('a missed quick check shows on the class view practice line as a try to skip', quickRow.practice.includes('**The Founding Documents** (quick check 2 out of 5)') && quickRow.missedQuickChecks === 1 && missRow.missedQuickChecks === 0);
  const notedRow = L.classView([{ id: 's_7', label: 'S-7', events: [...quickEvents, L.makeNoteEvent('Older note', '2026-09-08T10:00:00.000Z'), L.makeNoteEvent('Shy in groups; reads well aloud.\nSecond line.', '2026-09-09T11:00:00.000Z')] }], '2026-09-10T12:00:00.000Z')[0];
  ok('a class row carries the first line of the latest note', notedRow.note === 'Shy in groups; reads well aloud.' && missRow.note === '');
  ok('a class row carries every note for searching, first lines and full text', notedRow.notesAll.join('|') === 'Shy in groups; reads well aloud.|Older note' && notedRow.notesText.includes('Older note') && notedRow.notesText.includes('Second line.'));
  ok('a middle-sized shape choice is described in words', L.describeChoice('shape:triangle:medium') === 'the middle-sized triangle');
  ok('a big or small shape choice is described in words', L.describeChoice('shape:circle:big') === 'the big circle' && L.describeChoice('shape:square:small') === 'the small square' && L.describeChoice('shape:star') === 'shape:star');
  const passedQuick = [...quickEvents.slice(0, 1), L.makeQuickCheckEvent('early-republic', Array.from({ length: 5 }, () => ({ correct: true, timeMs: 9000 })), '2026-09-09T10:00:00.000Z'), L.makeQuickPlacedEvent('early-republic', '2026-09-09T10:00:00.000Z')];
  ok('a passed quick check shows as a module skipped', L.practiceLine(L.buildReport('S-5', passedQuick)).line.includes('Skipped by quick check: The Early Republic'));
  ok('a module skipped by quick check is placed and carries the passed check, so paper can tell it from mastery', (() => { const m = L.buildReport('S-5', passedQuick).modules.find((x) => x.id === 'early-republic'); return m.placed && !m.mastered && m.quickCheck && m.quickCheck.passed; })());
  ok('the stuck reason reads "best 1 of 5", never "best 1 of 5 of 5"', !rows[0].reasons.some((r) => /of \d+ of \d+/.test(r)) && rows[0].reasons.some((r) => r.includes('best score 2 out of 5')));
  const missSummary = L.summaryParagraph(L.buildReport('S-4', [L.makeCoursesEnabledEvent(['counting-k'], '2026-09-09T09:00:00.000Z'), ...oneMiss.events]));
  ok('the report summary names practice so far and what was tried but not passed', missSummary.includes('Practice so far: 1 round, 0 passed.') && missSummary.includes('Tried but not passed yet: Count to 5 (best attempt 2 out of 5, 1 try).'));
  const missParts = L.summaryParts(L.buildReport('S-4', [L.makeCoursesEnabledEvent(['counting-k'], '2026-09-09T09:00:00.000Z'), ...oneMiss.events]));
  ok('the summary parts hand the screen each tried module as a link, and keep it out of the prose', missParts.tried.length === 1 && missParts.tried[0].id === 'count-to-5' && missParts.tried[0].detail === 'best attempt 2 out of 5, 1 try' && missParts.tried[0].subject === 'Math' && !missParts.rest.includes('Tried but not passed') && missParts.rest.includes('Practice so far: 1 round, 0 passed.'));
  ok('a student doing fine is on track and the reason says how quick they were', rows.find((r) => r.label === 'S-2').band === 'on track' && /on track/.test(rows.find((r) => r.label === 'S-2').reasons.join(' ')));
  { const quick = { id: 'q', label: 'Q', events: [att('count-to-5', '2026-09-09T10:00:00.000Z', 5, 6000)] };
    const slow = { id: 's', label: 'S', events: [att('count-to-5', '2026-09-08T10:00:00.000Z', 2, 6000), att('count-to-5', '2026-09-08T11:00:00.000Z', 3, 6000), att('count-to-5', '2026-09-09T10:00:00.000Z', 5, 6000)] };
    const ordered = L.classView([quick, slow], '2026-09-10T12:00:00.000Z');
    ok('among students on track, the one who needed more tries comes first', ordered[0].label === 'S' && ordered[0].band === 'on track' && /took about 3.0 rounds per module/.test(ordered[0].reasons.join(' '))); }
  ok('every reason is a plain phrase, never a number alone', rows.every((r) => r.reasons.every((x) => /[a-z]/.test(x))));
  ok('each row names what the student should do next', rows.every((r) => typeof r.next === 'string'));
  ok('the summary explains the order, then counts', L.classSummary(rows).startsWith('Students on top could use a bit more guidance than those on bottom.') && L.classSummary(rows).endsWith('\n1 student needs help now (S-1). 1 student worth keeping an eye on. 1 on track.'));
  ok('an empty class says so', L.classSummary([]) === 'No students yet.');
  ok('September 11 and Veterans Day are remembered in any year, and ordinary days are not', L.remembranceFor('2026-09-11').id === 'september-11' && L.remembranceFor('2031-11-11').id === 'veterans-day' && !L.isRemembranceDay('2026-09-12') && !L.isRemembranceDay('2026-11-09'));
  ok('Memorial Day is the last Monday of May', L.remembranceFor('2026-05-25').id === 'memorial-day' && L.remembranceFor('2027-05-31').id === 'memorial-day' && !L.isRemembranceDay('2026-05-18') && !L.isRemembranceDay('2026-05-26'));
  ok('every remembrance card has a title and three or four plain lines', L.REMEMBRANCE_DAYS.every((d) => d.title && d.lines.length >= 3 && d.lines.length <= 4 && d.lines.every((l) => l.length > 30)));   // four lines in Mikey's words (2026-09-23)
  // Writing, marked by the educator
  { const wq = L.generateQuestion('wr4-topic-paragraph', 2);
    const sent = L.makeWritingEvent('topic-sentences', wq.prompt, 'Dogs make good pets. They are easy to feed. They love a walk. They sit with you.', [{ item: 'x', ticked: true }], '2026-09-14T10:00:00.000Z', '2026-09-14T10:05:00.000Z');
    ok('a sent piece is pending and counts as an attempt, not a pass', L.pendingWritings([sent]).length === 1 && L.deriveProgress([sent]).perModule['topic-sentences'].attempts === 1 && !L.deriveProgress([sent]).perModule['topic-sentences'].passed && L.deriveProgress([sent]).perModule['topic-sentences'].pendingWriting === true);
    const met = L.makeWritingMark('topic-sentences', sent.at, true, '', '2026-09-14T15:00:00.000Z');
    const pg = L.deriveProgress([sent, met]);
    ok('a mark that meets the bar is a pass on the day it was marked', pg.perModule['topic-sentences'].passed && pg.perModule['topic-sentences'].passes === 1 && !pg.perModule['topic-sentences'].mastered && L.pendingWritings([sent, met]).length === 0);
    const notYet = L.makeWritingMark('topic-sentences', sent.at, false, '', '2026-09-14T15:00:00.000Z');
    ok('not yet clears the waiting state without a pass', !L.deriveProgress([sent, notYet]).perModule['topic-sentences'].passed && L.pendingWritings([sent, notYet]).length === 0);
    const sent2 = L.makeWritingEvent('topic-sentences', wq.prompt, 'A second paragraph, a day later, with a topic sentence first and reasons after it.', [], '2026-09-15T10:00:00.000Z', '2026-09-15T10:05:00.000Z');
    const met2 = L.makeWritingMark('topic-sentences', sent2.at, true, '', '2026-09-15T12:00:00.000Z');
    ok('two pieces that meet the bar on different days earn the star', L.deriveProgress([sent, met, sent2, met2]).perModule['topic-sentences'].mastered === true);
    ok('a pass opens the next writing module', L.moduleStatuses(L.deriveProgress([sent, met]), ['writing-4']).find((x) => x.id === 'opinion-paragraph').status === 'available');
    ok('the module story tells the writing record', L.moduleStory('x', [sent, met], 'topic-sentences').includes('marked as meeting the bar')); }
  { const oq = L.generateQuestion('ord-numbers-100', 5); const nums = oq.answer.split(' | ').map(Number);
    ok('an order question is judged as a sequence', L.checkAnswer(oq, oq.answer) && !L.checkAnswer(oq, oq.items.join(' | ')) && nums.every((n, i) => i === 0 || n > nums[i - 1])); }
  // Placement check
  { ok('placement grades follow the band and skip spoken and hidden courses', JSON.stringify(L.placementGrades('Math', 'middle')) === '["6","7","8"]' && JSON.stringify(L.placementGrades('Reading', 'elementary')) === '["3","4","5"]' && JSON.stringify(L.placementGrades('Math', 'early')) === '["2"]');
    const probe = L.buildPlacementProbe('Math', '6', 11);
    ok('a probe is four questions from that grade and subject', probe.core.length === 4 && probe.core.every((q) => { const c = L.getCourse(L.getModule(q.fromModuleId).courseId); return c.grade === '6' && c.subject === 'Math'; }));
    ok('three of four clears a grade, two does not', L.placementCleared([{ correct: true }, { correct: true }, { correct: true }, { correct: false }]) && !L.placementCleared([{ correct: true }, { correct: true }, { correct: false }, { correct: false }]));
    const out = L.placementOutcome('Math', 'middle', ['6', '7']);
    ok('clearing two grades starts the student at the third and places past everything below it', out.startGrade === '8' && out.startCourseIds.join() === 'math-8' && ['ratios', 'fraction-meaning'].every((id) => out.clearedModuleIds.includes(id)) && !out.clearedModuleIds.includes('slope'));
    { const down = L.placementOutcome('Math', 'high', ['7'], '8'); ok('a high school student who clears grade 7 after failing 9 and 8 starts at grade 8 with everything below placed past', down.startGrade === '8' && down.startCourseIds.join() === 'math-8' && down.clearedModuleIds.includes('ratios') && !down.clearedModuleIds.includes('slope')); }
    const top = L.placementOutcome('Math', 'middle', ['6', '7', '8']);
    ok('clearing every grade in the band starts at the top of the band', top.startGrade === '8');
    const ev = [L.makePlacementEvent('Math', '8', out.clearedModuleIds, '2026-09-14T09:00:00.000Z')];
    const pg = L.deriveProgress(ev);
    ok('placed modules are passed for gating and never mastered', pg.passedIds.length === out.clearedModuleIds.length && pg.masteredIds.length === 0 && pg.perModule['ratios'].placed === true);
    ok('a placed module opens the ones after it', L.moduleStatuses(pg, ['math-8']).find((x) => x.id === 'slope').status === 'available');
    ok('placement is recorded per subject', L.placementDone(ev, 'Math') && !L.placementDone(ev, 'Reading'));
    ok('the report rows and story say placed past', L.buildReport('x', ev).modules.find((m) => m.id === 'ratios').placed === true && L.moduleStory('x', ev, 'ratios').includes('placement check placed past')); }
  // Cumulative checkpoint
  { const passOn = (id, i) => L.makeAttemptEvent({ moduleId: id, seed: 1 }, [1, 1, 1, 1, 1].map(() => ({ correct: true })), null, `2026-09-14T10:0${i}:00.000Z`, `2026-09-14T10:0${i}:30.000Z`);
    const three = ['fraction-meaning', 'equivalent-fractions', 'comparing-fractions'].map(passOn);
    ok('no checkpoint before four modules are passed', L.checkpointDue(three) === null);
    const four = [...three, passOn('fractions-on-a-line', 3)];
    ok('a checkpoint is due at four passed modules', L.checkpointDue(four) && L.checkpointDue(four).atCount === 4);
    const cp = L.buildCheckpoint(four, 5);
    ok('a checkpoint has eight questions drawn from passed modules only', cp.core.length === 8 && cp.core.every((q) => four.some((e) => e.moduleId === q.fromModuleId)));
    ok('a checkpoint never repeats a question', new Set(cp.core.map((q) => q.story + '|' + q.prompt)).size === 8);
    const done = L.makeCheckpointEvent(cp, cp.core.map((q, i) => ({ correct: i !== 2, given: 'x' })), '2026-09-14T11:00:00.000Z', '2026-09-14T11:05:00.000Z');
    const after = [...four, done];
    ok('a finished checkpoint is not offered again for the same count', L.checkpointDue(after) === null);
    ok('a missed checkpoint question marks that module for a refresher', L.refresherIds(after).length === 1 && L.refresherIds(after)[0] === cp.core[2].fromModuleId);
    ok('the pass and the star are kept after a miss', L.deriveProgress(after).passedIds.length === 4);
    const again = [...after, L.makeAttemptEvent({ moduleId: cp.core[2].fromModuleId, seed: 1 }, [1, 1, 1, 1, 1].map(() => ({ correct: true })), null, '2026-09-14T12:00:00.000Z', '2026-09-14T12:00:30.000Z')];
    ok('passing the module again clears the refresher', L.refresherIds(again).length === 0);
    ok('a checkpoint miss lowers confidence like a missed memory check', L.computeConfidence(cp.core[2].fromModuleId, after).score < L.computeConfidence(cp.core[2].fromModuleId, four).score);
    ok('the report flags the refresher and the module story explains it', L.buildReport('x', after).modules.find((m) => m.id === cp.core[2].fromModuleId).refresher === true && L.moduleStory('x', after, cp.core[2].fromModuleId).includes('missed in the last checkpoint'));
  }
  // Memory checks can come from any mastered module in any course
  { const mastered = ['fraction-meaning', 'count-to-5', 'letter-names']; const seen = new Set();
    for (let seed = 1; seed <= 60; seed++) { const a = L.buildAttempt('equivalent-fractions', seed, mastered); if (a.review) seen.add(a.review.moduleId); }
    ok('memory checks draw from the same course and from other courses', seen.has('fraction-meaning') && [...seen].some((id) => id !== 'fraction-meaning')); }
  { const mastered = ['fraction-meaning', 'count-to-5', 'letter-names']; let both = 0; let distinct = true;
    for (let seed = 1; seed <= 40; seed++) { const a = L.buildAttempt('equivalent-fractions', seed, mastered); if (a.review && a.review2) { both += 1; if (a.review.moduleId === a.review2.moduleId) distinct = false; } }
    ok('a round carries two memory checks from two different passed modules', both === 40 && distinct); }
  { const a = L.buildAttempt('equivalent-fractions', 3, ['fraction-meaning']);
    ok('with one passed module there is one memory check, not a repeat', a.review && !a.review2); }
  { const ev = [L.makeAttemptEvent({ moduleId: 'count-to-10', seed: 1 }, [{ correct: true }, { correct: true }, { correct: true }, { correct: true }, { correct: true }], { moduleId: 'count-to-5', correct: true }, 't0', 't1', { moduleId: 'letter-names', correct: false })];
    const pr = L.deriveProgress(ev);
    ok('both memory checks count in the review tally', pr.review.asked === 2 && pr.review.correct === 1); }
  // Course search: every typed word must appear, and grades are matched every way they are said
  ok('"grade 1 math" finds the grade 1 math course and nothing else', L.COURSES.filter((c) => L.matchesCourseSearch(c, 'grade 1 math')).map((c) => c.id).join() === 'numbers-1');
  ok('"1st grade" and "first grade" find the same courses', JSON.stringify(L.COURSES.filter((c) => L.matchesCourseSearch(c, '1st grade')).map((c) => c.id)) === JSON.stringify(L.COURSES.filter((c) => L.matchesCourseSearch(c, 'first grade')).map((c) => c.id)) && L.COURSES.some((c) => L.matchesCourseSearch(c, '1st grade')));
  ok('"math" finds every math course', L.COURSES.filter((c) => L.matchesCourseSearch(c, 'math')).length === L.COURSES.filter((c) => c.subject === 'Math').length);
  ok('"kinder reading" narrows to kindergarten reading', L.COURSES.filter((c) => L.matchesCourseSearch(c, 'kinder reading')).map((c) => c.id).join() === 'letters-k');
  ok('a word from a title works too', L.COURSES.filter((c) => L.matchesCourseSearch(c, 'fractions')).map((c) => c.id).includes('fractions-intro'));
  ok('an empty search matches everything', L.COURSES.every((c) => L.matchesCourseSearch(c, '  ')));
  ok('"pre k" typed as two words finds the pre-K courses, and "pr" already does', L.COURSES.filter((c) => L.matchesCourseSearch(c, 'pre k')).every((c) => c.grade.startsWith('PK')) && L.COURSES.filter((c) => L.matchesCourseSearch(c, 'pre k')).length === L.COURSES.filter((c) => c.grade.startsWith('PK')).length && L.COURSES.filter((c) => L.matchesCourseSearch(c, 'pr')).some((c) => c.grade.startsWith('PK')));
  ok('a search matches letter by letter as it is typed', L.COURSES.filter((c) => L.matchesCourseSearch(c, 'ki')).some((c) => c.grade === 'K') && L.COURSES.filter((c) => L.matchesCourseSearch(c, 'k')).length > 0);
  // The student's own summary
  { const ids = L.getCourse('fractions-intro').modules.map((m) => m.id); const p5 = (id, at, c) => ({ type: 'attempt_completed', at, startedAt: at, moduleId: id, seed: 1, core: [], review: null, coreCorrect: c, coreTotal: 5 });
    ok('a student with no rounds is told the easy first step', L.studentSummary([], ids)[0].includes('Open a module and try one'));
    ok('mastery is named and what it unlocks is explained', L.studentSummary([p5('fraction-meaning', 't1', 5)], ids).join(' ').includes('Because you know what a fraction means, **equivalent fractions** is open'));
    ok('a run of misses is framed as where learning happens', L.studentSummary([p5('fraction-meaning', 't1', 5), p5('equivalent-fractions', 't2', 1), p5('equivalent-fractions', 't3', 2), p5('equivalent-fractions', 't4', 1)], ids).join(' ').includes('A wrong answer shows you exactly what to learn next'));
    ok('a run of wins is named as a streak', L.studentSummary([p5('fraction-meaning', 't1', 5), p5('equivalent-fractions', 't2', 5), p5('comparing-fractions', 't3', 5)], ids).join(' ').includes('streak: 3 rounds mastered in a row'));
    ok('the summary is at least three sentences once there is anything to say', L.studentSummary([p5('fraction-meaning', 't1', 5)], ids).length >= 3); }
}

{ // Pictures are not recycled: no two lessons share an identical example picture (captions aside).
  const seen = new Map();
  // Dots, swatches and traced strokes are the concept itself (three dots is three), so those may repeat; drawings may not.
  for (const m of L.MODULES) { const ex = m.lesson.example; if (!ex || ['dots', 'swatch', 'trace'].includes(ex.kind)) continue; const key = JSON.stringify({ ...ex, caption: undefined }); seen.set(key, [...(seen.get(key) || []), m.id]); }
  const dup = [...seen.entries()].filter(([, ids]) => ids.length > 1);
  ok('no two lessons share an identical example picture', dup.length === 0, dup.map(([k, ids]) => `${k.slice(0, 40)} -> ${ids.join(',')}`).join(' | '));
}
{ // Grade completion counts mastered, placed-past and quick-check-passed modules, and only courses the student was given.
  const evs = [L.makeCoursesEnabledEvent(['counting-k'], 't')]; const ids = L.enabledCourseIds(evs);
  ok('a grade with nothing mastered is not complete', !L.gradeCompleted(evs, 'K', ids));
  const done = L.getCourse('counting-k').modules.map((m) => ({ type: 'placed', at: 't2', moduleIds: [m.id] }));
  ok('a grade whose every given module was placed past is complete', L.gradeCompleted([...evs, ...done], 'K', ids));
  ok('a grade whose courses were never given is not complete', !L.gradeCompleted([...evs, ...done], '1', ids));
  ok('completedGrades lists it once', JSON.stringify(L.completedGrades([...evs, ...done])) === '["K"]');
  let r = L.addStudent(L.emptyRoster(), 'S-9', 't', { level: 'early' }).roster;
  r = L.setCertificateState(r, 'S-9', 'K', 'skipped');
  ok('a skipped certificate is remembered and pending ones are the rest', L.certificatesPending(L.findStudent(r, 'S-9'), ['K', '1']).join() === '1');
}
{ // Taught before asked: a ratchet on tools/untaught.mjs. History is clean; the rest may only shrink.
  const STOP = new Set(['yes', 'no', 'true', 'false', 'same', 'different', 'more', 'fewer', 'less', 'bigger', 'smaller', 'both', 'neither', 'none', 'all']);
  const wordy = (a) => typeof a === 'string' && !/\d/.test(a) && a.trim().split(/\s+/).length <= 3 && !STOP.has(a.toLowerCase().replace(/[.!]$/, '')) && !/^(dots|shape|item|pic|art|icon|swatch|letters|solid):/.test(a) && a.length > 1;
  const untaught = (m) => { const ex = m.lesson.example || {}; const taught = [...m.lesson.paragraphs, m.lesson.keyIdea, ex.caption || '', ex.formula || '', ex.text || '', ...(m.lesson.script || []).map((x) => x.say)].join(' ').toLowerCase();
    for (const g of new Set(m.generators)) for (let seed = 1; seed <= 40; seed++) { const q = L.generateQuestion(g, seed); if (q.type !== 'choice' || !wordy(q.answer)) continue; const a = String(q.answer).toLowerCase().replace(/[.!]$/, ''); if (!taught.includes(a) && !`${q.story || ''} ${q.prompt || ''}`.toLowerCase().includes(a)) return true; } return false; };
  const flagged = L.MODULES.filter((m) => L.getCourse(m.courseId).subject !== 'Reading' && untaught(m)); const history = flagged.filter((m) => ['History', 'Science'].includes(L.getCourse(m.courseId).subject));
  ok('every history and science question asks only what its lesson said', history.length === 0, history.map((m) => m.id).join(','));
  ok('no lesson, in any subject, lets a question ask a recall answer it never said', flagged.length === 0, flagged.map((m) => m.id).join(','));
  ok('a wrong answer can point back to its lesson sentence', /halogens/i.test(L.taughtLine('periodic-table', 'Halogens') || '') && L.taughtLine('fraction-meaning', '3/4') === null);
}
{ // Stories met: one line per module, first opening counts, nothing about the child.
  const evs = [L.makeStoryReadEvent('cells', '2026-09-20T10:00:00.000Z'), L.makeStoryReadEvent('cells', '2026-09-21T10:00:00.000Z'), L.makeStoryReadEvent('ratios', '2026-09-22T10:00:00.000Z')];
  const read = L.storiesRead(evs);
  ok('a story is listed once, at its first opening', read.length === 2 && read[0].moduleId === 'cells' && read[0].at.startsWith('2026-09-20'));
  ok('a story event carries only the module and the time', Object.keys(L.makeStoryReadEvent('cells', 't')).sort().join() === 'at,moduleId,type');
}
ok('no pairs deck repeats a card, so every card has exactly one twin', Object.entries(L.PAIR_DECKS).every(([, deck]) => { const texts = deck.flat(); return new Set(texts).size === texts.length && deck.every((pr) => pr.length === 2); }), Object.entries(L.PAIR_DECKS).filter(([, deck]) => { const texts = deck.flat(); return new Set(texts).size !== texts.length; }).map(([k]) => k).join(','));
// Variety: every module that is not a tracing page yields at least four different questions across many seeds,
// so a repeat round is not the same round; a triple dose is three times the questions at the same scaled bar.
{
  const thin = L.MODULES.filter((m) => !m.generators.some((g) => /trace|mark/.test(g))).map((m) => { const set = new Set(); for (let s = 1; s <= 80; s++) { const q = L.generateQuestion(m.generators[s % m.generators.length], s * 7919 + 13); set.add(`${q.story}|${q.prompt}|${q.answer}`); } return [m.id, set.size]; }).filter(([, n]) => n < 4);
  ok('every non-tracing module has at least four different questions', thin.length === 0, thin.map(([id, n]) => `${id}:${n}`).join(','));
  const a = L.buildAttempt('fraction-meaning', 5, [], { dose: 3 });
  ok('a triple dose asks three times the questions', a.core.length === L.moduleRules('fraction-meaning').questions * 3 && a.dose === 3);
  const ev = { type: 'attempt_completed', moduleId: 'fraction-meaning', coreCorrect: 11, coreTotal: 15 };
  ok('a triple dose keeps the same bar, scaled', !L.isMasteredAttempt(ev) && L.isMasteredAttempt({ ...ev, coreCorrect: 12 }));
  const avoid = L.buildAttempt('sound', 9, [], { avoid: ['What makes a sound?'] });
  ok('a round avoids the prompts of the last rounds when it can', !avoid.core.some((q) => q.prompt === 'What makes a sound?'));
}
{
  // The memory check favors a mastered module with recent misses: over many seeds it is chosen far more often than chance.
  const mastered = ['count-to-10', 'shapes', 'sorting'].filter((id) => L.getModule(id));
  if (mastered.length >= 2) {
    const target = mastered[0]; let hits = 0; const N = 60;
    for (let s = 1; s <= N; s++) { const a = L.buildAttempt('making-ten', s, mastered, { missed: { [target]: 3 } }); if (a.review && a.review.moduleId === target) hits += 1; }
    ok('the memory check favors the most-missed mastered module', hits >= N * 0.45, `${hits} of ${N}`);
  }
  const ev = [{ type: 'attempt_completed', at: new Date().toISOString(), moduleId: 'sound', core: [{ correct: false }, { correct: true }], review: { moduleId: 'life-cycles', correct: false } }];
  const miss = L.recentMisses(ev);
  ok('recent misses count core and memory-check misses by module', miss.sound === 1 && miss['life-cycles'] === 1);
}
ok('remembrance days fire on their dates and stay quiet otherwise', L.remembranceFor('2026-05-25').id === 'memorial-day' && L.remembranceFor('2026-11-11').id === 'veterans-day' && L.remembranceFor('2026-09-11').id === 'september-11' && !L.remembranceFor('2026-05-18') && !L.remembranceFor('2026-03-03'));
{
  // Every read-aloud lesson yields a script with at least one spoken line and at least one card to show.
  const bad = L.MODULES.filter((m) => (L.getCourse(m.courseId) || {}).readAloud).map((m) => [m.id, L.readAloudScript(m)]).filter(([, sc]) => !sc.length || !sc.some((st) => st.say && st.say.trim()) || !sc.some((st) => st.show));
  ok('every read-aloud lesson has a script with a spoken line and a shown card', bad.length === 0, bad.map(([id]) => id).join(','));
}
ok('older students get longer rounds at the same bar', L.moduleRules('fraction-meaning').questions === 5 && L.moduleRules('ratios').questions === 8 && L.moduleRules('ratios').toMaster === 7 && L.moduleRules('functions').questions === 10 && L.moduleRules('functions').toMaster === 8 && L.buildAttempt('functions', 3, []).core.length === 10);
{
  // Let's Play rules (2026-09-23, Mikey): dots never overlap, connect-the-dots pictures grow down the list, the early
  // list never puts two of a kind side by side, and older students' games are spread so the kinds take turns.
  const close = Object.entries(L.DOT_SHAPES).map(([k, pts]) => [k, L.dotsTooClose(pts)]).filter(([, bad]) => bad.length);
  ok('no connect-the-dots picture has two dots closer than the gap', close.length === 0, close.map(([k, bad]) => `${k}:${JSON.stringify(bad)}`).join(' '));
  const dotGames = L.GAMES.filter((g) => g.kind === 'dots');
  ok('every dots game draws a listed picture and none is the name', dotGames.every((g) => L.DOT_SHAPES[g.shape]) && !dotGames.some((g) => g.shape === 'name'));
  const counts = dotGames.map((g) => L.DOT_SHAPES[g.shape].length);
  ok('connect-the-dots pictures get more dots down the list', counts.every((n, i) => i === 0 || n >= counts[i - 1]), counts.join(','));
  const early = L.gamesFor('2');   // what the oldest young learner sees, in list order
  ok('the early games never put two of a kind side by side', early.every((g, i) => i === 0 || g.kind !== early[i - 1].kind), early.map((g) => g.kind[0]).join(''));
  const older = L.GAMES.filter((g) => g.deck || g.kind === 'pong' || g.kind === 'sprint' || g.kind === 'order' || ((g.rule || g.jump || g.map || g.balance) && !g.young));
  // Rule decks (2026-09-23): two named groups, nothing in both, every word short enough for a chip, and every rule game names one.
  const deckBad = Object.entries(L.RULE_DECKS).flatMap(([id, d]) => [...(d.a.items.length < 4 || d.b.items.length < 4 ? [`${id} is short`] : []), ...d.a.items.filter((x) => d.b.items.includes(x)).map((x) => `${id} has ${x} in both`), ...[...d.a.items, ...d.b.items].filter((x) => !/^shape:/.test(x) && x.length > 11).map((x) => `${id}: ${x} is too long`)]);
  ok('every rule deck has two clean groups of short chips', deckBad.length === 0, deckBad.join(', '));
  ok('every rule game names a rule deck and the kinds are catch, path, buckets or ship', L.GAMES.filter((g) => g.rule).every((g) => L.RULE_DECKS[g.rule] && ['catch', 'path', 'buckets', 'ship'].includes(g.kind)));
  ok('older lists take a rule, jump or map game only when it is not for the youngest', L.GAMES.filter((g) => (g.jump || g.map || g.balance) && !g.young).every((g) => L.GRADES.indexOf(g.minGrade) >= L.GRADES.indexOf('3')));
  ok('the older list holds at least ten kinds of game', new Set(older.map((g) => g.kind)).size >= 10, [...new Set(older.map((g) => g.kind))].join(','));
  // Frog jumps (2026-09-23): every deck's questions land on a tick of its own line, over many seeds.
  const jumpBad = Object.entries(L.JUMP_DECKS).flatMap(([id, d]) => { const out = []; const rng = L.makeRng ? L.makeRng(7) : null; for (let sd = 1; sd <= 200; sd += 1) { let x = sd * 2654435761 % 4294967296; const r = () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; }; const q = d.make(r); const steps = Math.round((q.answer - d.lo) / d.step); if (q.answer < d.lo || q.answer > d.hi || Math.abs(d.lo + steps * d.step - q.answer) > 1e-9 || q.from < d.lo || q.from > d.hi) out.push(`${id}: ${q.ask} = ${q.answer}`); } return out; });
  ok('every frog jump lands on a tick of its line', jumpBad.length === 0, jumpBad.slice(0, 4).join(', '));
  ok('every map region is a polygon of at least four points with a name, and every map game names a map', Object.values(L.MAPS).every((m) => m.regions.length >= 4 && m.regions.every((r) => (r.parts || [r.points]).every((pts) => pts.length >= 4) && r.name)) && L.GAMES.filter((g) => g.map).every((g) => L.MAPS[g.map]));
  ok('the oceans and the hemispheres draw the continents behind them', Array.isArray(L.MAPS.oceans.land) && L.MAPS.oceans.land.length === 6 && Array.isArray(L.MAPS.hemispheres.land));
  // A region's corners never sit inside another region of the same map (Europe and the states must tile, not overlap).
  const overlapBad = ['europe', 'us-states', 'asia', 'africa', 'south-america'].flatMap((id) => { const rs = L.MAPS[id].regions; const out = []; rs.forEach((a, i) => rs.forEach((b, j) => { if (i !== j && (a.parts || [a.points]).some((pa) => pa.some((pt) => (b.parts || [b.points]).some((pb) => L.insidePolygon(pb, pt[0] + 0.01, pt[1] + 0.01))))) out.push(`${id}: ${a.id} in ${b.id}`); })); return out; });
  ok('Europe, Asia, Africa and South America hold twelve countries each, the states map twenty-five, and no region corner lies inside another', [L.MAPS.europe, L.MAPS.asia, L.MAPS.africa, L.MAPS['south-america']].every((m) => m.regions.length === 12) && L.MAPS['us-states'].regions.length === 25 && overlapBad.length === 0, overlapBad.slice(0, 6).join(', '));
  ok('a point in the top left of the world is in the Northern and Western hemispheres only', L.insidePolygon(L.MAPS.hemispheres.regions[0].points, 20, 10) && L.insidePolygon(L.MAPS.hemispheres.regions[2].points, 20, 10) && !L.insidePolygon(L.MAPS.hemispheres.regions[1].points, 20, 10));
  ok('a point is found inside its own region and not in another', L.insidePolygon(L.MAPS.continents.regions[3].points, 50, 34) && !L.insidePolygon(L.MAPS.continents.regions[2].points, 50, 34));
  ok('every map has an art serial, and the world maps share one', L.MAP_SERIALS.every((x) => /^M\d+$/.test(x)) && L.MAPS.oceans.art === L.MAPS.continents.art);
  // Balance the scale: every target a deck makes can be built from its tray, over many seeds.
  const balBad = Object.entries(L.BALANCE_DECKS).flatMap(([id, d]) => { const out = []; for (let sd = 1; sd <= 200; sd += 1) { let x = sd * 2654435761 % 4294967296; const r = () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; }; const t = d.make(r); if (!L.balanceReachable(d.weights, t.value)) out.push(`${id}: ${t.show}`); } return out; });
  ok('every balance target can be made from its weights', balBad.length === 0, balBad.slice(0, 4).join(', '));
  ok('a balance game names a deck, and the young one is for the youngest only', L.GAMES.filter((g) => g.balance).every((g) => L.BALANCE_DECKS[g.balance]) && L.GAMES.filter((g) => g.balance && g.young).every((g) => L.GRADES.indexOf(g.minGrade) <= L.GRADES.indexOf('2')));
  const spread = L.spreadKinds(older);
  ok('spreading keeps every game exactly once', spread.length === older.length && new Set(spread.map((g) => g.id)).size === older.length);
  const grade5 = L.spreadKinds(L.gamesFor('5').filter((g) => (g.deck || g.kind === 'pong' || g.kind === 'sprint' || g.kind === 'order') && (!g.courseId || g.courseId === 'science-5')));
  ok('a grade 5 list alternates kinds with no run longer than two', grade5.every((g, i) => i < 2 || !(g.kind === grade5[i - 1].kind && g.kind === grade5[i - 2].kind)), grade5.map((g) => g.kind[0]).join(''));
  const runs = spread.reduce((acc, g, i) => (i && g.kind === spread[i - 1].kind ? [...acc.slice(0, -1), acc[acc.length - 1] + 1] : [...acc, 1]), []);
  ok('even the full walk-through list never runs one kind more than five deep', Math.max(...runs) <= 5, runs.join(','));
  ok('titles of the early games are capitalized words', early.every((g) => g.title.split(' ').filter((w) => !['and', 'the', 'on'].includes(w)).every((w) => /^[A-Z]/.test(w))), early.map((g) => g.title).join(' | '));
}
// A game for every course (2026-09-24, Mikey, pass CO). Every course has at least one game its grade can play and students
// can see today; every game belongs to one course or is the starter; a course's games are different kinds; a new student
// has the starter and the first game open and nothing else; a course's quick fire draws only on that course's lessons.
// The two counts below are ceilings: new kinds must bring them down, never up (docs/GAMES-PLAN.md lists what to build).
{
  const ids = new Set(L.GAMES.map((g) => g.id)); const kindOf = (id) => L.GAMES.find((g) => g.id === id).kind;
  const attached = Object.values(L.COURSE_GAMES).flat();
  ok('every course has at least one game, and every one of them exists', L.COURSES.every((c) => (L.COURSE_GAMES[c.id] || []).length > 0) && attached.every((id) => ids.has(id)));
  ok('every game belongs to exactly one course or is the starter', L.GAMES.every((g) => attached.filter((id) => id === g.id).length + (L.STARTER_GAMES.includes(g.id) ? 1 : 0) === 1));
  ok('a course only gets games its grade can play', L.COURSES.every((c) => L.COURSE_GAMES[c.id].every((id) => { const g = L.GAMES.find((x) => x.id === id); return !g.minGrade || L.GRADES.indexOf(g.minGrade) <= L.GRADES.indexOf(c.grade); })));
  ok('every course has a game students can see today, not only a map waiting for its painting', L.COURSES.every((c) => L.COURSE_GAMES[c.id].some((id) => kindOf(id) !== 'map')));
  const twoOfAKind = L.COURSES.filter((c) => new Set(L.COURSE_GAMES[c.id].map(kindOf)).size < L.COURSE_GAMES[c.id].length).length;
  ok('no course holds two games of one kind (the element pairs left physics for the periodic table, 2026-09-25)', twoOfAKind === 0, `${twoOfAKind}`);
  let repeats = 0; for (const gr of L.GRADES) { const ks = L.COURSES.filter((c) => c.grade === gr).flatMap((c) => L.COURSE_GAMES[c.id].map(kindOf)); repeats += ks.length - new Set(ks).size; }
  ok('kinds repeated inside a grade stay at or under 10 (new kinds, timelines, the periodic table and find the evidence, 2026-09-25; world capitals in world geography, 2026-10-02)', repeats <= 10, `${repeats}`);
  const list = L.GAMES.filter((g) => ['counting-k', 'letters-k'].includes(L.gameCourse(g.id)) || L.STARTER_GAMES.includes(g.id));
  const fresh = L.unlockedGameIds([], list);
  ok('a new student has the starter and the first game open, and nothing from an unfinished course', fresh.size === new Set([...L.STARTER_GAMES, list[0].id]).size && list.slice(1).every((g) => L.STARTER_GAMES.includes(g.id) || !fresh.has(g.id)));
  const qf = L.GAMES.filter((g) => g.course);
  ok('a course quick fire draws only on its own course, and always has questions', qf.length > 0 && qf.every((g) => { const pool = L.sprintPool(L.MODULES, g); return pool.length > 0 && pool.length === L.sprintPool(L.MODULES.filter((m) => m.courseId === g.course), g).length; }));
}

// Sentence builder and fix it (2026-09-25): every sentence is pinned at both ends, and every mistake is findable.
{
  const endMark = /[.!?]$/;
  const pinned = (s) => { const w = s.split(' '); return /^[A-Z]/.test(w[0]) && w.filter((x) => /^[A-Z]/.test(x) && x !== 'I').length === 1 && w.filter((x) => endMark.test(x)).length === 1 && endMark.test(w[w.length - 1]) && !/  /.test(s); };
  ok('every sentence builder set has a short and a longer sentence, each with one capital first word and one end mark last', Object.values(L.BUILD_DECKS).every((d) => d.length >= 5 && d.every((s) => pinned(s.base) && pinned(s.more) && s.more.split(' ').length > s.base.split(' ').length)));
  ok('every fix it sentence names a wrong word that appears exactly once, and its fix reads as a whole sentence', Object.values(L.FIX_DECKS).every((d) => d.length >= 5 && d.every((it) => { const w = it.text.split(' '); return w.filter((x) => x === it.word).length === 1 && it.fixed && it.fixed !== it.word && endMark.test(it.text) && endMark.test(w.map((x) => (x === it.word ? it.fixed : x)).join(' ')) && it.why && it.why.length > 10; })));
  ok('every sentence builder and fix it game has its deck and a course', L.GAMES.filter((g) => g.kind === 'build' || g.kind === 'fix').length === 6 && L.GAMES.filter((g) => g.kind === 'build').every((g) => L.BUILD_DECKS[g.deck]) && L.GAMES.filter((g) => g.kind === 'fix').every((g) => L.FIX_DECKS[g.deck]) && L.GAMES.filter((g) => g.kind === 'build' || g.kind === 'fix').every((g) => Object.values(L.COURSE_GAMES).some((ids) => ids.includes(g.id))));
}


// Color mixer (2026-09-25): every pair of a deck's pots makes something, and every color to make has exactly one recipe.
{
  const decks = Object.values(L.MIX_DECKS);
  ok('every pair of a color mixer deck\'s pots mixes to a named color with a rule', decks.every((d) => d.pots.every((a) => d.pots.every((b) => { const m = L.mixOf(a, b); return m && m.name && /^#[0-9A-F]{6}$/.test(m.hex) && m.note; }))));
  ok('every color mixer target is made by exactly one pair of its pots and has a swatch', decks.every((d) => d.targets.every((t) => { let n = 0; for (let i = 0; i < d.pots.length; i++) for (let j = i + 1; j < d.pots.length; j++) if (L.mixOf(d.pots[i], d.pots[j]).name === t) n += 1; return n === 1 && L.MIX_COLORS[t]; }) && d.targets.length >= 5));
  ok('the wheel mixes right: two primaries a secondary, white a tint, black a shade, across the wheel brown', L.mixOf('red', 'yellow').name === 'orange' && L.mixOf('yellow', 'blue').name === 'green' && L.mixOf('blue', 'red').name === 'violet' && L.mixOf('red', 'white').name === 'pink' && L.mixOf('blue', 'black').name === 'navy' && L.mixOf('red', 'green').name === 'brown' && L.mixOf('yellow', 'violet').name === 'brown' && L.mixOf('blue', 'orange').name === 'brown' && L.mixOf('orange', 'red').name === 'red-orange');
  ok('the two color mixer games belong to the two art courses', L.COURSE_GAMES['art-3'][0] === 'mix-art-3' && L.COURSE_GAMES['art-4'][0] === 'mix-art-4' && L.GAMES.filter((g) => g.kind === 'mix').every((g) => L.MIX_DECKS[g.deck]));
}


// Debug the robot (2026-09-25): each program fails as written, and exactly one single-step change brings the robot home.
{
  const check = (deck, turns) => deck.every((p) => { const cmds = turns ? ['F', 'L', 'R'] : ['U', 'D', 'L', 'R']; const prog = p.program.split(''); if (L.runRobot(p, prog, turns).home) return false; let fixes = 0; for (let j = 0; j < prog.length; j++) for (const c of cmds) { if (c === prog[j]) continue; const t = prog.slice(); t[j] = c; const r = L.runRobot(p, t, turns); if (r.home && !r.crash) fixes += 1; } return fixes === 1 && prog.every((c) => cmds.includes(c)) && p.rocks.every(([a, b]) => !(a === p.goal[0] && b === p.goal[1]) && !(a === p.start[0] && b === p.start[1])); });
  ok('every arrows robot has a bug that exactly one single change fixes', L.ROBOT_DECKS.arrows.length >= 6 && check(L.ROBOT_DECKS.arrows, false));
  ok('every turns robot has a bug that exactly one single change fixes', L.ROBOT_DECKS.turns.length >= 6 && check(L.ROBOT_DECKS.turns, true));
  ok('the robot stops at the edge and at a rock, and turns in place', L.runRobot({ start: [0, 0], goal: [1, 0], rocks: [] }, ['L'], false).crash === 'edge' && L.runRobot({ start: [0, 0], goal: [2, 0], rocks: [[1, 0]] }, ['R'], false).crash === 'rock' && L.runRobot({ start: [2, 2, 0], goal: [3, 2], rocks: [] }, ['R', 'F'], true).home === true);
  { // Walk the Robot (pass FS): every walk has a path of five steps or fewer through the rocks, found here by a breadth-first search.
    const shortest = (p) => { const rock = new Set(p.rocks.map(([a, b]) => `${a},${b}`)); const seen = new Set([`${p.start[0]},${p.start[1]}`]); let ring = [[p.start[0], p.start[1]]]; for (let d = 0; d <= 8; d++) { if (ring.some(([x, y]) => x === p.goal[0] && y === p.goal[1])) return d; const next = []; for (const [x, y] of ring) for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) { const nx = x + dx; const ny = y + dy; const key = `${nx},${ny}`; if (nx < 0 || ny < 0 || nx > 4 || ny > 4 || rock.has(key) || seen.has(key)) continue; seen.add(key); next.push([nx, ny]); } ring = next; } return Infinity; };
    const walks = L.ROBOT_DECKS.walk;
    ok('every robot walk for the youngest reaches its star in five steps or fewer, with nothing on the start or the star', walks.length >= 8 && walks.every((p) => shortest(p) >= 2 && shortest(p) <= 5 && p.rocks.every(([a, b]) => !(a === p.goal[0] && b === p.goal[1]) && !(a === p.start[0] && b === p.start[1]) && a >= 0 && b >= 0 && a <= 4 && b <= 4)), walks.map(shortest).join(','));
    ok('the walk game belongs to computer science K to 2 and is for the youngest', L.COURSE_GAMES['tech-k'].includes('walk-tech-k') && L.GAMES.find((g) => g.id === 'walk-tech-k').young === true && !L.GAMES.find((g) => g.id === 'walk-tech-k').deck);
  }
  { // Eight Switches (pass FU): six different numbers a round, 0 to 255, the same on every device, and never two plain powers of two in a row.
    const rounds = [1, 2, 3, 7, 12].map((r) => L.bitsTargets(r));
    ok('every switches round has six different numbers within a byte, the same every time', rounds.every((t) => t.length === 6 && new Set(t).size === 6 && t.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) && JSON.stringify(L.bitsTargets(3)) === JSON.stringify(L.bitsTargets(3)) && JSON.stringify(rounds[0]) !== JSON.stringify(rounds[1]));
    ok('two plain powers of two never come in a row, so the switches have to be added', rounds.every((t) => t.every((n, i) => i === 0 || !((n & (n - 1)) === 0 && (t[i - 1] & (t[i - 1] - 1)) === 0))));
    ok('the switches game belongs to computer science 9 to 12 with eight switches', L.COURSE_GAMES['tech-9'].includes('bits-tech-9') && L.GAMES.find((g) => g.id === 'bits-tech-9').bits === 8 && !L.GAMES.find((g) => g.id === 'bits-tech-9').deck);
  }
  { // Teach the Robot (pass FT): every board starts with two wrong guesses or more and is right after five lessons or fewer, teaching the first wrong fruit each time.
    const boards = L.TEACH_DECKS.fruit;
    const walk = (b) => { let known = b.given.slice(); let n = 0; let first = -1; for (;;) { const g = L.teachGuesses(b, known); const wrong = b.items.map((it, i) => i).filter((i) => !known.includes(i) && g[i] !== b.items[i][2]); if (first < 0) first = wrong.length; if (!wrong.length) return { first, n }; known.push(wrong[0]); n += 1; if (n > 8) return { first, n }; } };
    const apart = (b) => b.items.every((a, i) => b.items.every((c, j) => i === j || (a[0] - c[0]) ** 2 + (a[1] - c[1]) ** 2 >= 100));
    ok('every teach board holds twelve fruits of two kinds, apart from each other, with one given example of each', boards.length >= 4 && boards.every((b) => b.items.length === 12 && apart(b) && b.given.length === 2 && b.items[b.given[0]][2] !== b.items[b.given[1]][2] && b.items.every(([x, y, kind]) => x >= 5 && x <= 95 && y >= 5 && y <= 95 && ['apple', 'banana'].includes(kind))));
    ok('every teach board starts wrong at least twice and is right after five lessons or fewer', boards.every((b) => { const r = walk(b); return r.first >= 2 && r.n >= 1 && r.n <= 5; }), boards.map((b) => JSON.stringify(walk(b))).join(' '));
    ok('the teach game belongs to the plain AI course and names its boards with its own key', L.COURSE_GAMES['tech-6'].includes('teach-tech-6') && L.GAMES.find((g) => g.id === 'teach-tech-6').teach === 'fruit' && !L.GAMES.find((g) => g.id === 'teach-tech-6').deck);
  }
  { // Pay the Price (pass FV): every price is payable exactly with two fives and five ones, and a round's four prices differ from the next round's.
    const payable = (n) => [0, 1, 2].some((f) => n - 5 * f >= 0 && n - 5 * f <= 5);
    ok('every price on the pay table can be counted out with two fives and five ones', [1, 2, 3, 4, 5, 6, 7, 8].every((r) => L.payPrices(r).length === 4 && L.payPrices(r).every((it) => it.price >= 3 && it.price <= 15 && payable(it.price) && typeof it.item === 'string')));
    ok('the pay game belongs to economics K to 2 and is for the youngest', L.COURSE_GAMES['econ-k'].includes('pay-econ-k') && L.GAMES.find((g) => g.id === 'pay-econ-k').young === true && !L.GAMES.find((g) => g.id === 'pay-econ-k').deck);
  }
  { // Set the Price (pass FW): four stands a round, twelve customers each with a top price from 1 to 8, and some price that makes a profit on every stand.
    ok('every stand has a price that earns a profit and a top price for each of twelve customers', [1, 2, 3, 4, 5, 6].every((r) => L.priceStands(r).length === 4 && L.priceStands(r).every((st) => st.tops.length === 12 && st.tops.every((t) => t >= 1 && t <= 8) && [1, 2, 3, 4, 5, 6, 7, 8].some((pr) => L.standProfit(st, pr).profit > 0))));
    ok('profit is price times buyers minus the fixed cost and the cost per cup', L.standProfit({ tops: [1, 4, 4, 8], fixed: 3, each: 1 }, 4).profit === 4 * 3 - 3 - 3 && L.standProfit({ tops: [1, 4, 4, 8], fixed: 3, each: 1 }, 9).buyers === 0);
    ok('the price game belongs to economics 3 to 5 and names its stands with its own key', L.COURSE_GAMES['econ-3'].includes('price-econ-3') && L.GAMES.find((g) => g.id === 'price-econ-3').price === 'stand' && !L.GAMES.find((g) => g.id === 'price-econ-3').deck);
  }
  { // Pay It Off (pass FX): four loans a round; the smallest payment beats the first month's interest, the largest clears the loan within twelve months.
    const clears = (plan, payment, months) => { let bal = plan.principal; for (let m = 0; m < months; m++) { const r = L.loanMonth(bal, plan.rate, payment); bal = r.balance; if (r.paid) return true; } return false; };
    ok('every loan plan can be paid off: the biggest payment clears it in twelve months and the smallest still shrinks it', [1, 2, 3, 4, 5].every((r) => L.loanPlans(r).length === 4 && L.loanPlans(r).every((pl) => pl.payments.length === 3 && pl.payments[0] < pl.payments[1] && pl.payments[1] < pl.payments[2] && pl.payments[0] > L.loanMonth(pl.principal, pl.rate, 0).interest && clears(pl, pl.payments[2], 12))));
    ok('a month adds interest on the balance and takes the payment off', JSON.stringify(L.loanMonth(1000, 2, 250)) === JSON.stringify({ interest: 20, balance: 770, paid: false }) && L.loanMonth(200, 2, 250).paid === true);
    ok('the loan game belongs to economics 6 to 8 and names its plans with its own key', L.COURSE_GAMES['econ-6'].includes('loan-econ-6') && L.GAMES.find((g) => g.id === 'loan-econ-6').loan === 'plans' && !L.GAMES.find((g) => g.id === 'loan-econ-6').deck);
  }
  { // Build the Fund (pass FY): a year's surprises never exceed what steady saving can cover, so saving the room every month ends in the black.
    ok('every fund year has four surprises that steady saving covers, and saving nothing ends in debt', [1, 2, 3, 4, 5].every((r) => { const y = L.fundYear(r); const hits = y.months.filter((m) => m.surprise > 0); let st = { fund: 0, loan: 0, spent: 0 }; let none = { fund: 0, loan: 0, spent: 0 }; y.months.forEach((m) => { st = L.fundMonth({ ...st, room: y.room }, y.room, m); none = L.fundMonth({ ...none, room: y.room }, 0, m); }); return hits.length === 4 && y.total <= y.room * 12 && st.loan === 0 && st.fund === y.room * 12 - y.total && none.loan > y.total; }));
    ok('the fund game belongs to personal finance 9 to 12 and names its year with its own key', L.COURSE_GAMES['econ-9'].includes('fund-econ-9') && L.GAMES.find((g) => g.id === 'fund-econ-9').fund === 'year' && !L.GAMES.find((g) => g.id === 'fund-econ-9').deck);
  }
  { // Split the Search (pass FZ): every board is 32 sorted, distinct values with the target on it, and binary search finds any target in six looks.
    const looks = (b) => { let lo = 0; let hi = b.values.length - 1; let n = 0; const t = b.values[b.target]; while (lo <= hi) { const mid = Math.floor((lo + hi) / 2); n += 1; if (b.values[mid] === t) return n; if (b.values[mid] < t) lo = mid + 1; else hi = mid - 1; } return Infinity; };
    ok('every search board is sorted and distinct with its target on it, and binary search finds it in six looks or fewer', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].every((seed) => { const b = L.searchBoard(seed); return b.values.length === 32 && new Set(b.values).size === 32 && b.values.every((v, i) => i === 0 || v > b.values[i - 1]) && b.target >= 0 && b.target < 32 && looks(b) <= 6; }));
    ok('the search game belongs to college computer science and names its board with its own key', L.COURSE_GAMES['tech-college'].includes('search-tech-college') && L.GAMES.find((g) => g.id === 'search-tech-college').search === 32 && !L.GAMES.find((g) => g.id === 'search-tech-college').deck);
  }
  { // Spot It (pass GE): every ask fits exactly one piece of its picture, pieces stay apart, and every kind and color is one the lesson names.
    const kinds = ['circle', 'square', 'triangle', 'zigzag', 'curve', 'straight']; const colors = ['red', 'yellow', 'blue', 'orange', 'green', 'purple'];
    ok('every Spot It picture has five pieces of known kinds and colors, kept apart, and asks that each fit exactly one piece', L.SPOT_SCENES.length >= 4 && L.SPOT_SCENES.every((sc) => sc.parts.length === 5 && sc.parts.every((p) => kinds.includes(p[0]) && colors.includes(p[1])) && sc.parts.every((a, i) => sc.parts.every((b, j) => i === j || (a[2] - b[2]) ** 2 + (a[3] - b[3]) ** 2 >= 18 * 18)) && sc.asks.length === 3 && sc.asks.every((ask) => sc.parts.filter((p) => L.spotMatches(p, ask)).length === 1)));
    ok('the spot game belongs to art and music K to 2 and is for the youngest', L.COURSE_GAMES['arts-k'].includes('spot-arts-k') && L.GAMES.find((g) => g.id === 'spot-arts-k').young === true && !L.GAMES.find((g) => g.id === 'spot-arts-k').deck);
  }
  { // What Comes Next (pass GF): every round shows a form twice, cut inside its second showing, and the answer is the piece the form puts next.
    ok('every pattern round follows its form and its answer is among the three choices', [1, 2, 3, 4, 5, 6].every((r) => L.patternRounds(r).length === 5 && L.patternRounds(r).every((q) => { const seq = q.form.toUpperCase().split(''); const map = {}; seq.forEach((l, i) => { if (!map[l]) map[l] = q.shown[i]; }); const full = seq.concat(seq).map((l) => map[l]); return q.shown.length > seq.length && q.shown.every((p, i) => p === full[i]) && q.answer === full[q.shown.length] && q.choices.length === 3 && q.choices.includes(q.answer) && new Set(q.choices).size === 3; })));
    ok('the pattern game belongs to art and music 3 to 5 and names its forms with its own key', L.COURSE_GAMES['arts-3'].includes('pattern-arts-3') && L.GAMES.find((g) => g.id === 'pattern-arts-3').pattern === 'forms' && !L.GAMES.find((g) => g.id === 'pattern-arts-3').deck);
  }
  { // Shape the Sound (pass GG): every plan can be matched, a flat line never matches a plan with a crescendo or a decrescendo, and the rule reads each marking.
    const build = (plan) => { const out = []; plan.forEach((m, i) => { const prev = i ? out[i - 1] : 3; out.push(m === 'piano' ? 1 : m === 'forte' ? 6 : m === 'crescendo' ? Math.min(6, Math.max(prev + 1, 2)) : Math.max(1, Math.min(prev - 1, 5))); }); return out; };
    ok('every dynamics plan is six markings that its own built line matches, and a flat line fails it', L.DYNAMICS_PLANS.every((plan) => plan.length === 6 && plan.every((m) => ['piano', 'forte', 'crescendo', 'decrescendo'].includes(m)) && L.dynamicsMatch(build(plan), plan) && !L.dynamicsMatch([3, 3, 3, 3, 3, 3], plan)) && [0, 1, 2, 3, 4].every((r) => [0, 1, 2, 3].every((k) => L.DYNAMICS_PLANS.includes(L.dynamicsPlan(r, k)))));
    ok('the shape game belongs to art and music 6 to 8 and names its plans with its own key', L.COURSE_GAMES['arts-6'].includes('shape-arts-6') && L.GAMES.find((g) => g.id === 'shape-arts-6').shape === 'dynamics' && !L.GAMES.find((g) => g.id === 'shape-arts-6').deck);
  }
  { // Build the Chord (pass GH): every chord stacks four then three half steps (major) or three then four (minor), every round names five distinct chords from the list, and the game belongs to arts-9.
    const step = (a, b) => (L.CHORD_NOTES.indexOf(b) - L.CHORD_NOTES.indexOf(a) + 12) % 12;
    ok('every chord in the list obeys the triad arithmetic', L.CHORD_LIST.every(([r, q]) => { const n = L.chordNotes(r, q); return n[0] === r && step(n[0], n[1]) === (q === 'major' ? 4 : 3) && step(n[1], n[2]) === (q === 'major' ? 3 : 4) && step(n[0], n[2]) === 7; }));
    ok('every chord round names five distinct chords with their notes', [1, 2, 3, 4, 5].every((r) => { const rs = L.chordRounds(r); return rs.length === 5 && new Set(rs.map((c) => c.root + c.quality)).size === 5 && rs.every((c) => c.notes.length === 3 && c.notes.join() === L.chordNotes(c.root, c.quality).join()); }));
    ok('the chord game belongs to art and music 9 to 12 and names its triads with its own key', L.COURSE_GAMES['arts-9'].includes('chord-arts-9') && L.GAMES.find((g) => g.id === 'chord-arts-9').chord === 'triads' && !L.GAMES.find((g) => g.id === 'chord-arts-9').deck);
  }
  { // Valid or Not (pass GI): the form decides validity, every round mixes forms, and every argument's three lines are built from its pair.
    ok('every argument round follows its form, and the two valid forms are exactly modus ponens and modus tollens', [1, 2, 3, 4, 5].every((r) => { const qs = L.argumentRounds(r); return qs.length === 6 && qs.every((q) => q.lines.length === 3 && q.lines[0].startsWith('If ') && q.lines[2].startsWith('So ') && q.valid === (q.form === 'modus ponens' || q.form === 'modus tollens')); }) && L.ARGUMENT_FORMS.filter((f) => f.valid).map((f) => f.name).sort().join(',') === 'modus ponens,modus tollens');
    ok('the valid game belongs to philosophy 9 to 12 and names its forms with its own key', L.COURSE_GAMES['philosophy-9'].includes('valid-philosophy-9') && L.GAMES.find((g) => g.id === 'valid-philosophy-9').valid === 'forms' && !L.GAMES.find((g) => g.id === 'valid-philosophy-9').deck);
  }
  { // Reason or Not (pass GJ): a reason supports a claim exactly when it is one of that claim's own, and every round mixes both kinds.
    ok('every reason round marks a reason as support exactly when it belongs to the claim, and mixes both kinds', [1, 2, 3, 4, 5, 6].every((r) => { const qs = L.reasonRounds(r); return qs.length === 6 && qs.every((q) => { const own = L.CLAIM_REASONS.find((c) => c[0] === q.claim)[1]; return q.supports === own.includes(q.reason); }); }) && [1, 2, 3, 4, 5, 6].some((r) => L.reasonRounds(r).some((q) => q.supports)) && [1, 2, 3, 4, 5, 6].some((r) => L.reasonRounds(r).some((q) => !q.supports)));
    ok('the reason game belongs to philosophy 6 to 8 and names its claims with its own key', L.COURSE_GAMES['philosophy-6'].includes('reason-philosophy-6') && L.GAMES.find((g) => g.id === 'reason-philosophy-6').reason === 'claims' && !L.GAMES.find((g) => g.id === 'reason-philosophy-6').deck);
  }
  { // Sort the Because (pass GK): every round offers exactly two real reasons, the claim's own, among four, and the fakes come from the shared pile.
    ok('every because round has four options with exactly two real ones, the claim\'s own, and two fakes from the pile', [1, 2, 3, 4, 5, 6].every((r) => { const qs = L.becauseRounds(r); return qs.length === 5 && qs.every((q) => { const own = L.BECAUSE_CLAIMS.find((c) => c[0] === q.claim)[1]; return q.options.length === 4 && q.options.filter((o) => o.real).length === 2 && q.options.every((o) => (o.real ? own.includes(o.text) : L.BECAUSE_FAKES.includes(o.text))) && new Set(q.options.map((o) => o.text)).size === 4; }); }));
    // Pass IY: the look of a card never gives its answer away, and Valid or Not never stacks two negatives in a line.
    { // Pass JA: ( ) are parentheses and [ ] are brackets, as American math, TEKS 5.4 and Common Core 5.OA.A.1 name them.
      // Any other bracket in a lesson, question, deck or story must be the square kind, named as such.
      const files = ['../src/logic.mjs', '../src/stories.mjs'].map((f) => readFileSync(new URL(f, import.meta.url), 'utf8'));
      const bad = files.flatMap((s) => [...s.matchAll(/(?<!g5-)\bbrackets?\b/gi)].map((m) => s.slice(Math.max(0, m.index - 70), m.index + 70)).filter((w) => !/square brackets|parentheses and brackets/i.test(w)));
      ok('every lesson, question, deck and story calls ( ) parentheses, and brackets only ever means [ ]', bad.length === 0, bad.slice(0, 3).join(' | '));
      ok('grade 5 practice asks a question with two levels of grouping, brackets outside', [1, 2, 3, 4, 5, 6].every((s) => { const q = L.generateQuestion('g5-two-levels', s); const m = /^(\d+) x \[(\d+) - \((\d+) \+ (\d+)\)\] = \?$/.exec(q.prompt); return m && Number(q.answer) === m[1] * (m[2] - m[3] - m[4]) && Number(q.answer) > 0 && new Set(q.choices).size === q.choices.length; }));
    }
    ok('every Sort the Because choice starts with Because, real or fake, so the form never gives the answer away', [...L.BECAUSE_CLAIMS.flatMap((c) => c[1]), ...L.BECAUSE_FAKES].every((s) => /^Because \S/.test(s)));
    ok('no Valid or Not line stacks two negatives, and none says it is not the case that', [1, 2, 3, 4, 5, 6, 7, 8].every((r) => L.argumentRounds(r).every((q) => q.lines.every((l) => (l.match(/\bnot\b/g) || []).length < 2 && !/not the case/.test(l)))));
    ok('the because game belongs to philosophy 3 to 5 and names its claims with its own key', L.COURSE_GAMES['philosophy-3'].includes('because-philosophy-3') && L.GAMES.find((g) => g.id === 'because-philosophy-3').because === 'claims' && !L.GAMES.find((g) => g.id === 'because-philosophy-3').deck);
  }
  { // Share the Cookies (pass GL): every round divides evenly, says its numbers, and the rounds use both two and three plates.
    ok('every share round divides its cookies evenly among its plates and says so', [1, 2, 3, 4, 5].every((r) => { const qs = L.shareRounds(r); return qs.length === 4 && qs.every((q) => q.cookies === q.plates * q.each && q.each >= 1 && q.say.startsWith(`${q.cookies} cookies`) && q.say.includes(`${q.plates} plates`)); }) && new Set(L.shareRounds(1).map((q) => q.plates)).size === 2);
    ok('the share game belongs to philosophy K to 2 and is for the youngest', L.COURSE_GAMES['philosophy-k'].includes('share-philosophy-k') && L.GAMES.find((g) => g.id === 'share-philosophy-k').young === true && !L.GAMES.find((g) => g.id === 'share-philosophy-k').deck);
  }
  { // Mean, Median, Mode (pass GM): every round's answer is the true statistic of its scores, whole, and sits among four distinct choices.
    const stat = (sc, ask) => { const so = [...sc].sort((a, b) => a - b); return ask === 'mean' ? sc.reduce((a, b) => a + b, 0) / sc.length : ask === 'median' ? so[2] : so.find((v, i) => so.indexOf(v) !== i); };
    ok('every stat round asks for a real average of its scores and offers four distinct choices with the answer among them', [1, 2, 3, 4, 5].every((r) => { const qs = L.statRounds(r); return qs.length === 6 && qs.every((q) => q.scores.length === 5 && Number.isInteger(q.answer) && stat(q.scores, q.ask) === q.answer && q.choices.length === 4 && new Set(q.choices).size === 4 && q.choices.includes(q.answer)); }) && new Set(L.statRounds(1).map((q) => q.ask)).size === 3);
    ok('the stat game belongs to psychology 9 to 12 and names its scores with its own key', L.COURSE_GAMES['psychology-9'].includes('stat-psychology-9') && L.GAMES.find((g) => g.id === 'stat-psychology-9').stat === 'scores' && !L.GAMES.find((g) => g.id === 'stat-psychology-9').deck);
  }
  { // Hold It in Mind (pass GN): five distinct words shown, four distinct choices, and exactly one of them from the list.
    ok('every recall round shows five distinct words and offers four distinct choices with exactly one from the list', [1, 2, 3, 4, 5].every((r) => { const qs = L.recallRounds(r); return qs.length === 5 && qs.every((q) => q.shown.length === 5 && new Set(q.shown).size === 5 && q.choices.length === 4 && new Set(q.choices).size === 4 && q.choices.filter((w) => q.shown.includes(w)).length === 1 && q.shown.includes(q.answer) && q.choices.includes(q.answer) && q.shown.every((w) => L.RECALL_WORDS.includes(w))); }));
    ok('the recall game belongs to psychology 6 to 8 and names its words with its own key', L.COURSE_GAMES['psychology-6'].includes('recall-psychology-6') && L.GAMES.find((g) => g.id === 'recall-psychology-6').recall === 'words' && !L.GAMES.find((g) => g.id === 'recall-psychology-6').deck);
  }
  { // Name the Feeling (pass GO): every round shows each of the six feelings once, with four distinct choices that hold the answer.
    ok('every feeling round names each feeling once with four distinct choices holding the answer', [1, 2, 3, 4, 5].every((r) => { const qs = L.feelingRounds(r); return qs.length === 6 && new Set(qs.map((q) => q.answer)).size === 6 && qs.every((q) => L.FEELINGS.includes(q.answer) && q.choices.length === 4 && new Set(q.choices).size === 4 && q.choices.includes(q.answer) && q.choices.every((c) => L.FEELINGS.includes(c))); }));
    ok('the face game belongs to psychology 3 to 5 and names its feelings with its own key', L.COURSE_GAMES['psychology-3'].includes('face-psychology-3') && L.GAMES.find((g) => g.id === 'face-psychology-3').face === 'feelings' && !L.GAMES.find((g) => g.id === 'face-psychology-3').deck);
  }
  { // Which Sense (pass GP): every round asks each sense once, and every thing belongs to exactly one sense.
    ok('every sense round asks each of the five senses once with a thing that belongs to it', [1, 2, 3, 4, 5].every((r) => { const qs = L.senseRounds(r); return qs.length === 5 && new Set(qs.map((q) => q.sense)).size === 5 && qs.every((q) => L.SENSE_THINGS.filter((t) => t[0] === q.thing).length === 1 && L.SENSE_THINGS.find((t) => t[0] === q.thing)[1] === q.sense); }));
    ok('the sense game belongs to psychology K to 2 and is for the youngest', L.COURSE_GAMES['psychology-k'].includes('sense-psychology-k') && L.GAMES.find((g) => g.id === 'sense-psychology-k').young === true && !L.GAMES.find((g) => g.id === 'sense-psychology-k').deck);
  }
  { // Cut the Fillers (pass GQ): every line carries two or three fillers from the list, its count matches, and the clean words come back in order.
    ok('every filler round carries counted fillers from the list and a clean line underneath', [1, 2, 3, 4, 5].every((r) => { const qs = L.fillerRounds(r); return qs.length === 5 && qs.every((q) => { const f = q.tokens.filter((t) => t.filler); return f.length === q.fillers && f.length >= 2 && f.length <= 3 && f.every((t) => L.FILLERS.includes(t.text)) && L.CLEAN_LINES.includes(q.tokens.filter((t) => !t.filler).map((t) => t.text).join(' ')); }); }));
    ok('the filler game belongs to speech 9 to 12 and names its lines with its own key', L.COURSE_GAMES['speech-9'].includes('filler-speech-9') && L.GAMES.find((g) => g.id === 'filler-speech-9').filler === 'lines' && !L.GAMES.find((g) => g.id === 'filler-speech-9').deck);
  }
  { // Fit the Room (pass GR): six lines a round, no room more than twice, every answer among the four rooms and every line from the list.
    ok('every room round offers six listed lines with their rooms among the four choices', [1, 2, 3, 4, 5].every((r) => { const qs = L.roomRounds(r); return qs.length === 6 && new Set(qs.map((q) => q.line)).size === 6 && L.ROOMS.every((room) => qs.filter((q) => q.answer === room).length <= 2) && qs.every((q) => q.choices.length === 4 && q.choices.includes(q.answer) && L.ROOM_LINES.some(([line, room]) => line === q.line && room === q.answer)); }));
    ok('the room game belongs to speech 6 to 8 and names its lines with its own key', L.COURSE_GAMES['speech-6'].includes('room-speech-6') && L.GAMES.find((g) => g.id === 'room-speech-6').room === 'lines' && !L.GAMES.find((g) => g.id === 'room-speech-6').deck);
  }
  { // Ask the Right Question (pass GS): six rounds from the list, each with four distinct questions holding the relevant one.
    ok('every ask round offers six listed things said with four questions holding the relevant one', [1, 2, 3, 4, 5].every((r) => { const qs = L.askRounds(r); return qs.length === 6 && new Set(qs.map((q) => q.said)).size === 6 && qs.every((q) => q.choices.length === 4 && new Set(q.choices).size === 4 && q.choices.includes(q.answer) && L.ASK_ROUNDS.some((a) => a.said === q.said && a.good === q.answer && a.off.every((o) => q.choices.includes(o)))); }));
    ok('the ask game belongs to speech 3 to 5 and names its topics with its own key', L.COURSE_GAMES['speech-3'].includes('ask-speech-3') && L.GAMES.find((g) => g.id === 'ask-speech-3').ask === 'topics' && !L.GAMES.find((g) => g.id === 'ask-speech-3').deck);
  }
  { // Whose Turn Next (pass GT): six holders a round, never the same holder twice in a row, and the answer is always the next friend around the circle.
    ok('every turn round names the next friend around the circle for six holders', [1, 2, 3, 4, 5].every((r) => { const qs = L.turnRounds(r); return qs.length === 6 && qs.every((q, i) => q.holder >= 0 && q.holder < 4 && q.answer === L.TURN_FRIENDS[(q.holder + 1) % 4] && (i === 0 || q.holder !== qs[i - 1].holder)); }));
    ok('the turn game belongs to speech K to 2, is marked young and names its friends with its own key', L.COURSE_GAMES['speech-k'].includes('turn-speech-k') && L.GAMES.find((g) => g.id === 'turn-speech-k').young === true && L.GAMES.find((g) => g.id === 'turn-speech-k').turn === 'friends' && !L.GAMES.find((g) => g.id === 'turn-speech-k').deck);
  }
  { // Read the Jar (pass GU): six samples a round, each adding to 100 percent, every answer following the one texture rule, and all three textures present.
    ok('every jar round has six samples adding to 100 with answers that follow the texture rule and all three textures present', [1, 2, 3, 4, 5].every((r) => { const qs = L.jarRounds(r); return qs.length === 6 && qs.every((q) => q.sand + q.silt + q.clay === 100 && q.sand >= 0 && q.silt >= 0 && q.clay >= 0 && q.answer === L.jarTexture(q.sand, q.silt, q.clay) && q.choices.length === 3 && q.choices.includes(q.answer)) && L.JAR_TEXTURES.every((t) => qs.some((q) => q.answer === t)); }));
    ok('the jar game belongs to agriculture 9 to 12 and names its textures with its own key', L.COURSE_GAMES['agriculture-9'].includes('jar-agriculture-9') && L.GAMES.find((g) => g.id === 'jar-agriculture-9').jar === 'textures' && !L.GAMES.find((g) => g.id === 'jar-agriculture-9').deck);
    ok('the soil-sample and farm-profit questions compute their answers', [...Array(40).keys()].every((i) => { const a = L.generateQuestion('ag-soil', i); const b = L.generateQuestion('ag-farm', i); const okA = !a.story || (() => { const n = a.story.match(/\d+/g).map(Number); return a.answer === `${100 - n[0] - n[1] - n[2]} percent`; })(); const okB = !b.story || (() => { const n = b.story.match(/\d+/g).map(Number); return b.answer === `$${n[2] - n[0] - n[1]}`; })(); return okA && okB; }));
  }
  { // Who Gains (pass GX): six listed cases a round, no relationship more than twice, the four names as choices, every answer from the list.
    ok('every relation round offers six listed cases with their answers among the four names', [1, 2, 3, 4, 5].every((r) => { const qs = L.relationRounds(r); return qs.length === 6 && new Set(qs.map((q) => q.line)).size === 6 && L.FARM_RELATIONS.every((n) => qs.filter((q) => q.answer === n).length <= 2) && qs.every((q) => q.choices.length === 4 && q.choices.includes(q.answer) && L.RELATION_CASES.some(([line, answer]) => line === q.line && answer === q.answer)); }));
    ok('the relation game belongs to agriculture 6 to 8 and names its cases with its own key', L.COURSE_GAMES['agriculture-6'].includes('relation-agriculture-6') && L.GAMES.find((g) => g.id === 'relation-agriculture-6').relation === 'cases' && !L.GAMES.find((g) => g.id === 'relation-agriculture-6').deck);
    ok('the hen-project profit questions compute their answers', [...Array(40).keys()].every((i) => { const q = L.generateQuestion('a6-project', i); if (!q.story) return true; const n = q.story.match(/\d+/g).map(Number); return q.answer === `$${n[2] - n[0] - n[1]}`; }));
  }
  { // Will It Sprout? (pass HB): six seeds a round; a seed sprouts exactly when it has water, air and warmth, light never decides it;
    // every round has both answers and at least one seed that sprouts in the dark.
    ok('every sprout round follows the water, air and warmth rule, with a seed that sprouts in the dark', [1, 2, 3, 4, 5].every((r) => { const qs = L.sproutRounds(r); return qs.length === 6 && qs.every((q) => q.answer === (q.water && q.air && q.warm ? 'yes' : 'no')) && qs.some((q) => q.answer === 'yes' && !q.light) && qs.some((q) => q.answer === 'no'); }));
    ok('the sprout game belongs to agriculture 3 to 5 and names its seeds with its own key', L.COURSE_GAMES['agriculture-3'].includes('sprout-agriculture-3') && L.GAMES.find((g) => g.id === 'sprout-agriculture-3').sprout === 'seeds' && !L.GAMES.find((g) => g.id === 'sprout-agriculture-3').deck);
    ok('the squash-tally questions compute their answers', [...Array(40).keys()].every((i) => { const q = L.generateQuestion('ag3-tiny', i); if (!q.story) return true; const n = q.story.match(/\d+/g).map(Number); return q.answer === String(n[0] + n[1] + n[2]); }));
  }
  { // Grow the Plant (pass HC): four rounds, each a listed plant with five distinct pictures, the three needs and two toys from the list.
    ok('every grow round shows all three plant problems, each plant needing one of them (pass IV)', [1, 2, 3, 4, 5, 6].every((r) => { const qs = L.growRounds(r); return qs.every((q) => L.GROW_NEEDS.includes(q.need) && q.items.includes(q.need)) && L.GROW_NEEDS.every((n) => qs.some((q) => q.need === n)); }) && L.GROW_NEEDS.every((n) => L.GROW_PROBLEMS[n] && L.GROW_PROBLEMS[n].say.endsWith('.')));
    ok('every grow round holds the three needs and two different toys for a listed plant', [1, 2, 3, 4, 5].every((r) => { const qs = L.growRounds(r); return qs.length === 4 && qs.every((q) => L.GROW_PLANTS.includes(q.plant) && q.items.length === 5 && new Set(q.items).size === 5 && L.GROW_NEEDS.every((n) => q.items.includes(n)) && q.items.filter((i) => L.GROW_TOYS.includes(i)).length === 2); }));
    ok('the grow game belongs to agriculture K to 2, is marked young and names its needs with its own key', L.COURSE_GAMES['agriculture-k'].includes('grow-agriculture-k') && L.GAMES.find((g) => g.id === 'grow-agriculture-k').young === true && L.GAMES.find((g) => g.id === 'grow-agriculture-k').grow === 'needs' && !L.GAMES.find((g) => g.id === 'grow-agriculture-k').deck);
  }
  { // The Better Deal (pass HF): six items a round, never a tie, and the answer is always the offer that saves more.
    ok('every better-deal round names the offer that saves more, with no ties', [1, 2, 3, 4, 5].every((r) => { const qs = L.dealRounds(r); return qs.length === 6 && new Set(qs.map((q) => q.what)).size === 6 && qs.every((q) => q.off < q.price && Number.isInteger(L.dealSaving(q.price, q.pct)) && L.dealSaving(q.price, q.pct) !== q.off && q.answer === (L.dealSaving(q.price, q.pct) > q.off ? q.pctLabel : q.offLabel)); }));
    ok('the better-deal game belongs to business 6 to 8 with its own key', L.COURSE_GAMES['business-6'].includes('deal-business-6') && L.GAMES.find((g) => g.id === 'deal-business-6').deal === 'offers' && !L.GAMES.find((g) => g.id === 'deal-business-6').deck);
    ok('the middle school money banks compute their sales tax, register, net worth and deal answers', [...Array(80).keys()].every((i) => { const e = L.generateQuestion('bz6-earn', i); const b = L.generateQuestion('bz6-bank', i); const s = L.generateQuestion('bz6-start', i); const okE = !e.story || !e.story.includes('sales tax') || e.answer === `$${((Number(e.story.match(/\$(\d+)/)[1]) * 10825) / 10000).toFixed(2)}`; const nb = b.story ? b.story.match(/\d+/g).map(Number) : null; const okB = !nb || b.answer === `$${nb[0] + nb[1] - nb[2] - nb[3]}`; const ns = s.story && s.story.startsWith('A $') ? s.story.match(/\d+/g).map(Number) : null; const okS = !ns || s.answer === (ns[0] * ns[1] / 100 > ns[2] ? `${ns[1]} percent off` : `$${ns[2]} off`); return okE && okB && okS && new Set(e.choices).size === e.choices.length && new Set(b.choices).size === b.choices.length; }));
  }
  { // Break Even (pass HD): six businesses a round, every answer a whole number equal to fixed costs over what each sale leaves, four distinct positive choices.
    ok('every break-even round has whole-number answers from the one rule and four distinct choices', [1, 2, 3, 4, 5].every((r) => { const qs = L.breakevenRounds(r); return qs.length === 6 && new Set(qs.map((q) => q.what)).size === 6 && qs.every((q) => Number.isInteger(q.answer) && q.answer === L.breakevenUnits(q.fixed, q.price, q.cost) && q.price > q.cost && q.choices.length === 4 && new Set(q.choices).size === 4 && q.choices.includes(q.answer) && q.choices.every((c) => Number.isInteger(c) && c > 0)); }));
    ok('the break-even game belongs to business 9 to 12 and names its businesses with its own key', L.COURSE_GAMES['business-9'].includes('breakeven-business-9') && L.GAMES.find((g) => g.id === 'breakeven-business-9').breakeven === 'businesses' && !L.GAMES.find((g) => g.id === 'breakeven-business-9').deck);
    ok('the money bank computes its break-even and net-pay answers', [...Array(60).keys()].every((i) => { const q = L.generateQuestion('bz-money', i); if (!q.story) return true; const n = q.story.match(/\d+/g).map(Number); if (q.prompt.startsWith('How many tacos')) return q.answer === String(n[0] / (n[1] - n[2])) && q.choices.length === 4 && new Set(q.choices).size === 4; return q.answer === `$${n[0] * n[1] - n[2]}` && new Set(q.choices).size === 4; }));
  }
  { // Fill the Jar (pass HG): six goals a round, every answer the goal divided by the weekly amount, four distinct positive choices.
    ok('every fill-the-jar round divides evenly and has four distinct choices', [1, 2, 3, 4, 5].every((r) => { const qs = L.savejarRounds(r); return qs.length === 6 && new Set(qs.map((q) => q.what)).size === 6 && qs.every((q) => Number.isInteger(q.answer) && q.answer === L.savejarWeeks(q.goal, q.weekly) && q.choices.length === 4 && new Set(q.choices).size === 4 && q.choices.includes(q.answer) && q.choices.every((c) => c > 0)); }));
    ok('the jar game belongs to business 3 to 5 and names its goals with its own key', L.COURSE_GAMES['business-3'].includes('savejar-business-3') && L.GAMES.find((g) => g.id === 'savejar-business-3').savejar === 'goals' && !L.GAMES.find((g) => g.id === 'savejar-business-3').deck);
    ok('the jar and stand banks compute their weeks and profits', [...Array(80).keys()].every((i) => { const a = L.generateQuestion('bz3-jars', i); const b = L.generateQuestion('bz3-stand', i); const okA = !a.story || (() => { const n = a.story.match(/\d+/g).map(Number); return a.answer === `${n[0] / n[1]} weeks` && new Set(a.choices).size === 4; })(); const okB = !b.story || (() => { const n = b.story.match(/\d+/g).map(Number); return b.answer === `$${n[0] - n[0] * n[2] / 100 - n[3]}` && new Set(b.choices).size === 4; })(); return okA && okB; }));
  }
  { // Flow diagrams (pass HG, Mikey's screenshots): every flow diagram in every lesson keeps each label inside its box.
    const flows = []; for (const c of L.COURSES) for (const m of c.modules) { const ex = m.lesson.example; if (!ex) continue; if (ex.kind === 'flow') flows.push(ex.steps); const others = Array.isArray(ex.another) ? ex.another : (ex.another ? [ex.another] : []); for (const a of others) if (a && a.visual && a.visual.kind === 'flow') flows.push(a.visual.steps); }
    const bad = flows.filter((steps) => { const lay = L.flowLayout(steps); if (lay.dir === 'row') return steps.some((t) => String(t).length > 12); return lay.boxes.some((bx) => bx.lines.length > 2 || bx.lines.some((ln) => ln.length * bx.size * L.FLOW_CHAR_EM > bx.w - 8 + 1e-9) || bx.lines.length * bx.size * 1.2 > bx.h - 2 + 1e-9); });
    ok('every flow diagram in every lesson keeps each label inside its box', flows.length > 100 && bad.length === 0);
    ok('a flow of short labels keeps its row, and a long label turns it into a column', L.flowLayout(['seed', 'seedling', 'plant']).dir === 'row' && L.flowLayout(['one cow', 'the herd', 'the herd, the grass, the egrets', 'plus soil, water and weather']).dir === 'column');
  }
  { // Tools for the Job (pass HH): each round asks all six jobs once, each with its own tool and two others, three distinct pictures.
    ok('every tools-for-the-job round asks each job once with its right tool among three', [1, 2, 3, 4, 5].every((r) => { const qs = L.toolRounds(r); return qs.length === 6 && new Set(qs.map((q) => q.job)).size === 6 && qs.every((q) => L.TOOL_JOBS.find((t) => t[0] === q.job)[1] === q.answer && q.choices.length === 3 && new Set(q.choices).size === 3 && q.choices.includes(q.answer)); }));
    ok('the tools game belongs to business K to 2, is marked young, and names its jobs with its own key', L.COURSE_GAMES['business-k'].includes('tool-business-k') && L.GAMES.find((g) => g.id === 'tool-business-k').young === true && L.GAMES.find((g) => g.id === 'tool-business-k').tool === 'jobs');
    ok('the K to 2 money banks compute their saving and making sums', [...Array(80).keys()].every((i) => { for (const g of ['bzk-save', 'bzk-make']) { const q = L.generateQuestion(g, i); if (!q.story) continue; const n = (q.story.match(/\d+/g) || []).map(Number); if (g === 'bzk-make' && q.answer !== `${n[0] + n[1]} dollars`) return false; if (g === 'bzk-save') { const each = q.story.includes('one dollar') ? 1 : 2; const weeks = Number(q.prompt.match(/\d+/)[0]); if (q.answer !== `${each * weeks} dollars`) return false; } if (new Set(q.choices).size !== 3) return false; } return true; }));
  }
  { // Sort the Ledger (pass HK): six accounts a round, two from each side of the balance sheet, each on its true side.
    ok('every ledger round deals two accounts from each side, each on its true side', [1, 2, 3, 4, 5].every((r) => { const qs = L.ledgerRounds(r); return qs.length === 6 && new Set(qs.map((q) => q.item)).size === 6 && L.LEDGER_SIDES.every((side) => qs.filter((q) => q.answer === side).length === 2) && qs.every((q) => L.LEDGER_ITEMS.find((it) => it[0] === q.item)[1] === q.answer); }));
    { // Pass JD: college Public Speaking, built on ACGM SPCH 1315, with its own game.
      const c = L.COURSES.find((x) => x.id === 'speech-college');
      ok('college Public Speaking has four lessons at grade C', !!c && c.grade === 'C' && c.subject === 'Speech' && c.elective === true && c.modules.length === 4, c ? c.modules.map((m) => m.id).join(',') : 'missing');
      ok('Cite It or Not belongs to college speech and deals three of each a round', (L.COURSE_GAMES['speech-college'] || []).includes('cite-speech-college') && [1, 2, 3, 7, 12].every((r) => { const d = L.citeRounds(r); return d.length === 6 && d.filter((x) => x.answer === 'cite').length === 3 && new Set(d.map((x) => x.text)).size === 6 && d.every((x) => x.why); }));
      ok('every Cite It or Not card gives the lesson\'s reason', L.CITE_CARDS.length === 14 && L.CITE_CARDS.every(([, a, w]) => (a === 'cite' ? /source|credit|names/i : /common knowledge|own/i).test(w)));
    }
    { // Pass JC: college macroeconomics, built on ACGM ECON 2301, with its own game.
      const c = L.COURSES.find((x) => x.id === 'macroeconomics-college');
      ok('college macroeconomics has four lessons at grade C', !!c && c.grade === 'C' && c.subject === 'Economics' && c.elective === true && c.modules.length === 4, c ? c.modules.map((m) => m.id).join(',') : 'missing');
      ok('In GDP or Not belongs to college macroeconomics and deals three of each a round', (L.COURSE_GAMES['macroeconomics-college'] || []).includes('gdp-macroeconomics-college') && [1, 2, 3, 7, 12].every((r) => { const d = L.gdpRounds(r); return d.length === 6 && d.filter((x) => x.answer === 'in').length === 3 && new Set(d.map((x) => x.text)).size === 6 && d.every((x) => x.why); }));
      ok('every In GDP or Not card is new production or names why it is left out', L.GDP_CARDS.length === 14 && L.GDP_CARDS.filter((x) => x[1] === 'in').length === 7 && L.GDP_CARDS.filter((x) => x[1] === 'out').every(([t, , w]) => /used|stock|check|flour|home|made in|counted/i.test(t + ' ' + w)));
    }
    { // Pass JB: college General Psychology, built on ACGM PSYC 2301, with its own game.
      const c = L.COURSES.find((x) => x.id === 'psychology-college');
      ok('college General Psychology has four lessons at grade C', !!c && c.grade === 'C' && c.subject === 'Psychology' && c.elective === true && c.modules.length === 4, c ? c.modules.map((m) => m.id).join(',') : 'missing');
      ok('Cause or Correlation belongs to college psychology and deals three experiments and three correlations a round', (L.COURSE_GAMES['psychology-college'] || []).includes('cause-psychology-college') && [1, 2, 3, 7, 12].every((r) => { const d = L.causeRounds(r); return d.length === 6 && d.filter((x) => x.answer === 'experiment').length === 3 && new Set(d.map((x) => x.text)).size === 6 && d.every((x) => x.why); }));
      ok('every Cause or Correlation experiment names chance, and no correlation does', L.CAUSE_STUDIES.every(([t, a]) => (a === 'experiment') === /random|coin flip|by chance/i.test(t)), L.CAUSE_STUDIES.filter(([t, a]) => (a === 'experiment') !== /random|coin flip|by chance/i.test(t)).map((x) => x[0]).join(' | '));
    }
    ok('the ledger game belongs to college business and names its accounts with its own key', L.COURSE_GAMES['business-college'].includes('ledger-business-college') && L.GAMES.find((g) => g.id === 'ledger-business-college').ledger === 'accounts');
    ok('the college accounting bank computes owners\' equity and the current ratio', [...Array(80).keys()].every((i) => { const q = L.generateQuestion('bzc-money', i); if (!q.story) return true; const n = q.story.match(/\d+/g).map(Number); if (new Set(q.choices).size !== 4 || !q.choices.includes(q.answer)) return false; if (q.prompt.includes('equity')) return q.answer === `$${n[0] - n[2]},000`; return Number(q.answer) === n[0] / n[2]; }));
  }
  { // What's new (pass HL, Mikey): short notes are cut at the first colon or first sentence, naturally, and never inside a price or an abbreviation.
    ok("a What's new note is shortened at its first colon or its first sentence", briefNews('Finishing the course unlocks Grow the Plant, a new kind of game for small hands: water, sunshine and soil grow the plant.') === 'Finishing the course unlocks Grow the Plant, a new kind of game for small hands.' && briefNews('Two new Wonder questions wait. The strand is complete.') === 'Two new Wonder questions wait.' && briefNews('A one-sentence note stays whole.') === 'A one-sentence note stays whole.');
    ok("a short note never cuts a price or an abbreviation", briefNews('Prices like $4.95 and the U.S. economy stay whole.') === 'Prices like $4.95 and the U.S. economy stay whole.');
    const doc = '## October 1, 2026 (newer)\n\n- New one: detail.\n\n## September 30, 2026 (older)\n\n- Old one.\n'; const h = recentNews(doc, 6);
    ok('the More Details history lists the newest update first, with its title and full notes', h.length === 2 && h[0].date === 'October 1, 2026' && h[0].title === 'newer' && h[0].items[0] === 'New one: detail.');
  }
  { // Read the Label (pass HM): six comparisons, two for each nutrient, the asked-for difference at least its gap, and the answer the better label.
    const gap = { sodium: 80, 'added sugars': 3, fiber: 2 };
    ok('every label round compares two foods fairly and names the better one', [1, 2, 3, 4, 5].every((r) => { const qs = L.labelRounds(r); return qs.length === 6 && L.LABEL_NUTRIENTS.every(([n]) => qs.filter((q) => q.nutrient === n).length === 2) && qs.every((q) => { const d = q.a[q.nutrient] - q.b[q.nutrient]; if (Math.abs(d) < gap[q.nutrient]) return false; const aBetter = q.goal === 'less' ? d < 0 : d > 0; return q.answer === (aBetter ? 'A' : 'B'); }); }));
    ok('the label game belongs to health 6 to 8 and names its foods with its own key', L.COURSE_GAMES['health-6'].includes('label-health-6') && L.GAMES.find((g) => g.id === 'label-health-6').label === 'foods');
    ok('the health food bank computes the sodium in several servings', [...Array(80).keys()].every((i) => { const q = L.generateQuestion('hl6-food', i); if (!q.story) return true; const per = Number(q.story.match(/\d+/)[0]); const n = Number(q.prompt.match(/\d+/)[0]); return q.answer === `${per * n} milligrams` && new Set(q.choices).size === q.choices.length && q.choices.length >= 3; }));
  }
  { // Push to the Beat (pass HN): the pace comes from the gaps between taps, and only 100 to 120 a minute is just right.
    const taps = (gap, n = 12) => Array.from({ length: n }, (_, i) => i * gap);
    ok('the CPR pace is measured from the gaps between taps', L.cprRate(taps(500)) === 120 && L.cprRate(taps(545)) === 110 && L.cprRate(taps(600)) === 100 && L.cprRate([0]) === 0);
    ok('only 100 to 120 compressions a minute is just right', L.cprVerdict(99) === 'too slow' && L.cprVerdict(100) === 'just right' && L.cprVerdict(120) === 'just right' && L.cprVerdict(121) === 'too fast' && L.CPR_TARGET.low === 100 && L.CPR_TARGET.high === 120);
    ok('the CPR game belongs to high school health and names its compressions with its own key', L.COURSE_GAMES['health-9'].includes('cpr-health-9') && L.GAMES.find((g) => g.id === 'cpr-health-9').cpr === 'compressions');
    ok('the high school food bank computes the calories in a whole bag', [...Array(80).keys()].every((i) => { const q = L.generateQuestion('hl9-food', i); if (!q.story) return true; const n = q.story.match(/\d+/g).map(Number); return q.answer === String(n[0] * n[1]) && new Set(q.choices).size === 4; }));
  }
  { // Green Flag or Red Flag (pass HO): eight behaviors a round, four of each flag, each with its true flag.
    ok('every green-or-red round deals four of each flag, each with its true flag', [1, 2, 3, 4, 5].every((r) => { const qs = L.greenredRounds(r); return qs.length === 8 && new Set(qs.map((q) => q.behavior)).size === 8 && qs.filter((q) => q.answer === 'green').length === 4 && qs.every((q) => L.GREENRED_CARDS.find((c) => c[0] === q.behavior)[1] === q.answer); }));
    ok('the green-or-red game belongs to the reproductive and sexual health elective', L.COURSE_GAMES['sexual-health-6'].includes('greenred-sexual-health-6') && L.GAMES.find((g) => g.id === 'greenred-sexual-health-6').greenred === 'behaviors');
    ok('the reproductive and sexual health course is an elective, so it appears only when an educator assigns it', L.COURSES.find((c) => c.id === 'sexual-health-6').elective === true);
  }
  { // The human sexuality elective (pass HO): it asks for consent, and its Wonder questions never leave it.
    const hs = L.COURSES.find((c) => c.id === 'sexual-health-6'); const gated = L.WONDER.filter((w) => w.courseIds.includes('sexual-health-6'));
    const plain = L.WONDER.find((w) => w.stage === 'teen' && w.courseIds.includes('health-6'));
    ok('the human sexuality elective is an elective that asks for a parent\'s consent', !!hs && hs.elective === true && hs.consent === 'human-sexuality');
    ok('its Wonder questions appear only inside it, while other questions still follow the stage', gated.length === 2 && gated.every((w) => !L.wonderAllowed(w, 'health-6', 'teen') && !L.wonderAllowed(w, 'psychology-6', 'teen') && L.wonderAllowed(w, 'sexual-health-6', 'teen')) && !!plain && L.wonderAllowed(plain, 'psychology-6', 'teen'));
  }
  { // The high school human sexuality elective (pass HP): consent, gated Wonder questions, and a fair Myth or Fact deal.
    const hs9 = L.COURSES.find((c) => c.id === 'sexual-health-9'); const gated9 = L.WONDER.filter((w) => w.courseIds.includes('sexual-health-9'));
    ok('the high school human sexuality elective asks for consent and keeps its Wonder questions inside it', !!hs9 && hs9.elective === true && hs9.consent === 'human-sexuality' && gated9.length === 2 && gated9.every((w) => !L.wonderAllowed(w, 'health-9', 'grown') && L.wonderAllowed(w, 'sexual-health-9', 'grown')));
    ok('every Myth or Fact round deals three myths and three facts, each with a reason', [1, 2, 3, 4, 5].every((r) => { const qs = L.mythfactRounds(r); return qs.length === 6 && new Set(qs.map((q) => q.text)).size === 6 && qs.filter((q) => q.answer === 'myth').length === 3 && qs.every((q) => (q.answer === 'myth' || q.answer === 'fact') && q.why.length > 10); }));
    ok('the Myth or Fact game belongs to the high school human sexuality elective', L.COURSE_GAMES['sexual-health-9'].includes('mythfact-sexual-health-9') && L.GAMES.find((g) => g.id === 'mythfact-sexual-health-9').mythfact === 'statements');
  }
  { // No repeated questions (pass HR, Mikey's screenshots): a round never asks the same question twice, and the number of
    // modules whose banks are smaller than their round may only fall. When a bank grows, lower SHORT_POOL_LIMIT to match.
    const SHORT_POOL_LIMIT = 0; // the program is finished (pass HX): every module must fill its round
    const repeats = []; for (const c of L.COURSES) for (const m of c.modules) for (const seed of [1, 2, 3]) { const core = L.buildAttempt(m.id, seed, []).core.filter((q) => q.type !== 'trace'); if (new Set(core.map((q) => L.questionKey(q))).size !== core.length) repeats.push(m.id); }
    ok('no practice round, in any module, asks the same question twice', repeats.length === 0);
    // No reduction in questions (Mikey, pass HX): every module's round is full length, never shortened.
    const shortRounds = []; for (const c of L.COURSES) for (const m of c.modules) for (const seed of [1, 2, 3]) if (L.buildAttempt(m.id, seed, []).core.length < L.moduleRules(m.id).questions) shortRounds.push(m.id);
    ok('every practice round, in every module, is full length', shortRounds.length === 0);
    const QP = await import('../tools/question-pools.mjs'); const short = QP.shortPools(200);
    ok(`no new module has fewer different questions than its round (at most ${SHORT_POOL_LIMIT}, now ${short.length})`, short.length <= SHORT_POOL_LIMIT);
    { const src = (await import('node:fs')).readFileSync(new URL('../src/logic.mjs', import.meta.url), 'utf8'); const keys = [...src.matchAll(/^  '([a-z0-9-]+)': \(rng\) => \{/gm)].map((m) => m[1]); const twice = keys.filter((k, i) => keys.indexOf(k) !== i);
      ok('no question bank is defined twice, so an edit can never land on an unused copy', twice.length === 0); }
    ok('the two agriculture banks from the screenshots fill a ten-question round', QP.poolSize(['ag-scope']) >= 12 && QP.poolSize(['ag-animals']) >= 12);
    // Pass IU (Mikey: the same question and answer twice in one Animal sounds round): a new wrong choice does not make a question new.
    ok('a repeat is the same question and answer, whatever the wrong choices', L.questionKey({ prompt: 'Tap the cup.', answer: 'icon:cup', choices: ['icon:cup', 'icon:sun'] }) === L.questionKey({ prompt: 'Tap the cup.', answer: 'icon:cup', choices: ['icon:moon', 'icon:cup'] }) && L.questionKey({ prompt: 'Tap the cup.', answer: 'icon:cup' }) !== L.questionKey({ prompt: 'Tap the cup.', answer: 'icon:sun' }));
    ok('an Animal sounds round never asks for the same animal twice', [1, 2, 3, 4, 5, 6, 7, 8].every((seed) => { const core = L.buildAttempt('animal-sounds', seed, []).core; return new Set(core.map((q) => `${q.prompt}|${q.answer}`)).size === core.length; }));
  }
  { // No prompt runs past 400 characters (pass JE, Mikey: "we probably don't need a hard 70 character limit"). The 70 and 110
    // limits are gone, so questions can carry the context and flow they need; this guard only catches a pasted paragraph.
    const QP = await import('../tools/question-pools.mjs'); const longs = QP.longPrompts(200, 400);
    ok(`no prompt in any bank runs past 400 characters (now ${longs.length} over${longs.length ? ': ' + longs.slice(0, 3).map((r) => r.generator).join(', ') : ''})`, longs.length === 0);
  }
  { // Questions that read well (pass IB, Mikey): the wording checks in tools/question-review.mjs find questions that end in a
    // fragment, lean on a setup they come before, leave a word hanging, say 1 meters or a 8, or explain with a label or by
    // repeating the answer. The read-through passes fix the rest by hand; this count may only fall.
    const WORDING_FLAG_LIMIT = 0; // pass IB: 13 explanations that only repeat their answer (grades 7, 9 and 12)
    const QR = await import('../tools/question-review.mjs'); const flagged = QR.flaggedQuestions(150);
    ok(`no new question reads badly to the wording checks (at most ${WORDING_FLAG_LIMIT}, now ${flagged.length})`, flagged.length <= WORDING_FLAG_LIMIT);
  }
  ok('the two robot games sit in the two programming courses beside their first games', L.COURSE_GAMES['tech-3'].includes('debug-tech-3') && L.COURSE_GAMES['tech-5'].includes('debug-tech-5') && L.GAMES.filter((g) => g.kind === 'debug').every((g) => L.ROBOT_DECKS[g.deck]));
}


// History timelines (2026-09-25): every dated set runs strictly forward in time, with a date for every event.
{
  const decks = ['texas4', 'cultures6', 'us8', 'world10', 'us11', 'gov12'];
  ok('every history timeline set has five events, a date for each, and runs strictly forward', decks.every((k) => L.ORDER_DECKS[k] && L.ORDER_DECKS[k].length >= 3 && L.ORDER_DECKS[k].every((s) => s.steps.length === 5 && (!s.years || (s.years.length === 5 && s.when.length === 5 && s.years.every((y, i) => i === 0 || y > s.years[i - 1]))))));
  ok('every history timeline game sits in its history course beside its map', ['history-4', 'history-6', 'history-8', 'history-10', 'history-11', 'government-12'].every((c) => L.COURSE_GAMES[c].some((id) => { const g = L.GAMES.find((x) => x.id === id); return g && g.kind === 'order' && decks.includes(g.deck); }) && L.COURSE_GAMES[c].some((id) => id.startsWith('map-'))));
}


// The periodic table (2026-09-25): the data is right, every question has exactly one answer on the table.
{
  const P = L.PTABLE; const at = (sym) => P.find((e) => e.sym === sym);
  ok('the table holds the main groups of periods 1 to 5, numbers rising left to right in each period, symbols and names unique', P.length === 34 && new Set(P.map((e) => e.sym)).size === 34 && new Set(P.map((e) => e.name)).size === 34 && [1, 2, 3, 4, 5].every((per) => { const row = P.filter((e) => e.period === per).sort((a, b) => a.group - b.group); return row.every((e, i) => i === 0 || e.z > row[i - 1].z); }));
  ok('known elements sit where they belong', at('Na').z === 11 && at('Na').group === 1 && at('Na').period === 3 && at('Cl').z === 17 && at('Cl').group === 17 && at('He').group === 18 && at('He').period === 1 && at('Kr').z === 36 && at('Sn').z === 50 && at('Sn').group === 14 && at('I').z === 53 && at('Xe').period === 5 && at('Ga').z === 31 && at('Ga').group === 13);
  ok('hydrogen is not called an alkali metal, and the families read right', L.ptableFamily(at('H')) === null && L.ptableFamily(at('K')) === 'alkali metal' && L.ptableFamily(at('Ca')) === 'alkaline earth metal' && L.ptableFamily(at('Br')) === 'halogen' && L.ptableFamily(at('Ar')) === 'noble gas' && L.ptableFact(at('Na')) === 'Na is sodium: 11 protons, group 1, period 3, an alkali metal.');
  const fits = (q) => P.filter((e) => (q.kind === 'name' ? q.ask === `Tap ${e.name}.` : q.kind === 'protons' ? q.ask.includes(` ${e.z} proton`) : q.kind === 'place' ? q.ask.includes(`group ${e.group}, period ${e.period}.`) : L.ptableFamily(e) && q.ask === `Tap the ${L.ptableFamily(e)} in period ${e.period}.`));
  ok('every periodic table question over sixty rounds has exactly one element that fits, and it is the answer', Array.from({ length: 60 }, (_, r) => L.ptableQuestions(r)).every((qs) => qs.length === 8 && new Set(qs.map((q) => q.z)).size === 8 && qs.every((q) => { const f = fits(q); return f.length === 1 && f[0].z === q.z; })));
  ok('the periodic table game belongs to chemistry, and physics no longer holds two pairs games', L.COURSE_GAMES['science-10'].includes('ptable-science-10') && !L.COURSE_GAMES['science-11'].includes('pairs-elements'));
}


// Find the evidence (2026-09-25): every passage is whole sentences, its answer is one of them, and each reading course
// that had a quick fire now has this game instead.
{
  const decks = Object.values(L.EVIDENCE_DECKS);
  ok('every evidence passage has four or five whole sentences, a question, one answer among them and a reason', decks.length === 4 && decks.every((d) => d.length >= 6 && d.every((it) => it.text.length >= 4 && it.text.length <= 5 && it.text.every((s) => /^[A-Z"]/.test(s) && /[.!?]"?$/.test(s)) && new Set(it.text).size === it.text.length && /\?$/.test(it.ask) && Number.isInteger(it.answer) && it.answer >= 0 && it.answer < it.text.length && it.why && it.why.length > 10)));
  ok('the nine reading courses that held quick fires now hold find the evidence', ['reading-3', 'reading-4', 'reading-5', 'reading-8', 'reading-9', 'reading-10', 'reading-11', 'reading-12', 'reading-college'].every((c) => L.COURSE_GAMES[c].length === 1 && L.COURSE_GAMES[c][0] === `evidence-${c}` && L.EVIDENCE_DECKS[L.GAMES.find((g) => g.id === `evidence-${c}`).deck]));
}


// Security pass (2026-09-25): parsing drops prototype keys; wrong PIN tries rest the box on every fifth.
{
  const parsed = L.safeJson('{"a":1,"__proto__":{"polluted":true},"nested":{"constructor":{"prototype":{"x":1}},"b":2}}');
  ok('safeJson keeps ordinary data and drops __proto__, constructor and prototype keys at every depth', parsed.a === 1 && parsed.nested.b === 2 && !Object.prototype.hasOwnProperty.call(parsed, '__proto__') && !Object.prototype.hasOwnProperty.call(parsed.nested, 'constructor') && ({}).polluted === undefined);
  ok('safeJson returns null for text that is not JSON', L.safeJson('not json') === null && L.safeJson('') === null);
  let s = { failures: 0, lockUntil: 0 }; const t0 = 1000000;
  for (let i = 0; i < 4; i++) s = L.pinLockAfterFailure(s, t0);
  const fourOk = L.pinLockLeft(s, t0) === 0; s = L.pinLockAfterFailure(s, t0);
  const firstRest = L.pinLockLeft(s, t0) === 30 && L.pinLockLeft(s, t0 + 30001) === 0;
  for (let i = 0; i < 5; i++) s = L.pinLockAfterFailure(s, t0 + 40000);
  const secondRest = L.pinLockLeft(s, t0 + 40000) === 60;
  let big = { failures: 0, lockUntil: 0 }; for (let i = 0; i < 60; i++) big = L.pinLockAfterFailure(big, t0);
  ok('four wrong PIN tries do nothing, the fifth rests the box 30 seconds, the tenth 60, and the rest never passes 15 minutes', fourOk && firstRest && secondRest && L.pinLockLeft(big, t0) === 900);
}


// License codes (2026-09-25): pre-K and kindergarten are free; a signed code opens grade 1 and up for one child's year.
{
  const { readFileSync } = await import('node:fs');
  const devKey = JSON.parse(readFileSync(new URL('./fixtures/dev-license-private.json', import.meta.url), 'utf8'));
  const code = await L.makeLicenseCode(devKey, { id: 'TX-0001', name: 'Frederick', year: '2026-27', until: '2027-07-31' });
  const good = await L.checkLicenseCode(code, new Date('2026-10-01T12:00:00'));
  ok('a signed code checks out with its details', good.ok === true && good.id === 'TX-0001' && good.name === 'Frederick' && good.year === '2026-27' && good.until === '2027-07-31');
  const [head, payload, sig] = code.split('.');
  const forged = btoa(JSON.stringify({ id: 'TX-0001', name: 'Frederick', year: '2026-27', until: '2099-12-31' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  ok('an edited code is refused', (await L.checkLicenseCode(`${head}.${forged}.${sig}`, new Date('2026-10-01T12:00:00'))).ok === false);
  ok('a code past its last day is refused, and says so', (await L.checkLicenseCode(code, new Date('2027-08-01T09:00:00'))).reason === 'That code ended on 2027-07-31.');
  ok('text that is not a code is refused kindly', (await L.checkLicenseCode('hello')).ok === false && (await L.checkLicenseCode('')).ok === false);
  const otherPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const otherPriv = await crypto.subtle.exportKey('jwk', otherPair.privateKey);
  ok('a code signed with any other key is refused', (await L.checkLicenseCode(await L.makeLicenseCode(otherPriv, { id: 'X', name: 'Y', year: '2026-27', until: '2027-07-31' }), new Date('2026-10-01'))).ok === false);
  ok('pre-K 3, pre-K 4 and kindergarten courses are free, grade 1 and up are not', L.COURSES.filter(L.courseIsFree).length > 0 && L.COURSES.every((c) => L.courseIsFree(c) === ['PK3', 'PK4', 'K'].includes(c.grade)) && L.COURSES.filter(L.courseIsFree).reduce((n, c) => n + c.modules.length, 0) === 118);   // 86 plus computer science (FS), economics (FV), art and music (GE), philosophy (GL), psychology (GP) and speech (GT), four modules each
  const mixed = ['counting-k', 'reading-3', 'letters-k'];
  ok('without a license only the free courses open; with one, all of them do', JSON.stringify(L.openCourseIds(mixed, false)) === JSON.stringify(['counting-k', 'letters-k']) && L.openCourseIds(mixed, true).length === 3);
  ok('the app carries a public key only, marked as the development key until launch', !('d' in L.LICENSE_PUBLIC_KEY) && L.LICENSE_KEY_IS_DEVELOPMENT === true);
}


// Mikey's Wonder rules (2026-09-28): one reflection per two modules worked; after a failed round or several misses in
// a row, reframing failure and handling feelings come first, even ahead of questions never seen; never a third time;
// and every stage holds more than enough, even for a student who struggles often.
{
  const approvedAll = L.approveAllWonder(L.emptyWonderReview());
  const at = (h) => `2026-09-01T${String(h).padStart(2, '0')}:00:00.000Z`;
  const round = (id, h, correctFlags) => ({ type: 'attempt_completed', at: at(h), startedAt: at(h), moduleId: id, seed: 1, core: correctFlags.map((c) => ({ correct: c })), review: null, coreCorrect: correctFlags.filter(Boolean).length, coreTotal: correctFlags.length });
  const good = [true, true, true, true, true];
  const passedButShaky = [true, false, false, false, true];
  const failedRound = [false, false, true, false, false];
  const comfortTheme = (w) => w && (w.theme === 'failure' || w.theme === 'feelings');
  // Every early question answered once, so no question is unseen except none; then a failure must still pick comfort first.
  const everyWorldOnce = L.WONDER.filter((w) => w.stage === 'early' && w.theme === 'world').map((w, i) => L.makeWonderEvent(w.id, 'count-to-5', at(1) + i, 30, 5));
  const worldUnseen = [round('count-to-5', 2, good), round('count-to-10', 3, failedRound)];
  ok('after a failed round a failure or feelings question comes first', comfortTheme(L.nextWonder(worldUnseen, 'counting-k', approvedAll)));
  ok('three misses in a row inside a passed round also count as a rough patch', L.missStreak(round('m', 1, passedButShaky)) === 3 && comfortTheme(L.nextWonder([round('count-to-5', 2, good), round('count-to-10', 3, passedButShaky)], 'counting-k', approvedAll)));
  const comfortSeenOnce = L.WONDER.filter((w) => w.stage === 'early' && comfortTheme(w)).map((w, i) => ({ ...L.makeWonderEvent(w.id, 'count-to-5', at(4), 30, 5), at: `2026-09-01T04:00:${String(i).padStart(2, '0')}.000Z` }));
  const afterFail = [...comfortSeenOnce, round('count-to-5', 6, good), round('count-to-10', 7, failedRound)];
  ok('a rough patch still picks a comfort question over a world question never seen', comfortTheme(L.nextWonder(afterFail, 'counting-k', approvedAll)));
  const calm = [round('count-to-5', 2, good), round('count-to-10', 3, good)];
  ok('with no rough patch, the rotation is unchanged and a question is still due after two modules', L.nextWonder(calm, 'counting-k', approvedAll) !== null);
  const twice = (w) => [L.makeWonderEvent(w.id, 'm', at(1), 30, 5), L.makeWonderEvent(w.id, 'm', at(2), 30, 5)];
  const onlyOne = { version: 1, approved: ['w-fell-off-bike'], hidden: [] };
  ok('a question answered twice is never offered a third time', L.nextWonder([...twice({ id: 'w-fell-off-bike' }), round('count-to-5', 3, good), round('count-to-10', 4, failedRound)], 'counting-k', onlyOne) === null);
  // Enough for years: at one reflection per two modules, each stage's pool (each question twice) covers the stage half
  // again, and its failure and feelings questions alone cover three reflections in four.
  for (const stage of ['early', 'growing', 'teen', 'grown']) {
    const modules = L.COURSES.filter((c) => L.stageForGrade(c.grade) === stage).reduce((n, c) => n + c.modules.length, 0);
    const need = Math.ceil(modules / L.WONDER_EVERY);
    const pool = L.WONDER.filter((w) => w.stage === stage);
    const comfort = pool.filter(comfortTheme);
    ok(`${stage}: ${pool.length} questions cover ${need} reflections half again`, pool.length * L.WONDER_MAX_REPEATS >= Math.ceil(need * 1.5));
    ok(`${stage}: ${comfort.length} failure and feelings questions cover three reflections in four`, comfort.length * L.WONDER_MAX_REPEATS >= Math.ceil(need * 0.75));
  }
  const spokenComfort = L.WONDER.filter((w) => w.stage === 'early' && Array.isArray(w.simple) && comfortTheme(w));
  ok('pre-readers have spoken failure and feelings questions for three early reflections in four', spokenComfort.length * L.WONDER_MAX_REPEATS >= Math.ceil(0.75 * L.COURSES.filter((c) => L.stageForGrade(c.grade) === 'early').reduce((n, c) => n + c.modules.length, 0) / L.WONDER_EVERY));
}

// Explanations stand on their own (pass JO, Mikey: review the explanatory quality too). A learner hears or reads the
// explanation after a wrong answer, so it says the answer and the reason in whole sentences instead of continuing a
// thought ("And in good shape."). Checked for the grades read by hand so far, pre-K through grade 1.
{
  const early = L.COURSES.filter((c) => ['PK3', 'PK4', 'K', '1'].includes(String(c.grade)));
  const bad = [];
  for (const c of early) for (const m of c.modules) for (const g of [...new Set(m.generators)]) for (let s = 1; s < 80; s++) {
    let q; try { q = L.generateQuestion(g, s * 7919); } catch (e) { continue; }
    if (/^(And|But|Then|Or|So|If not)\b/.test(String(q.explain || '')) && !/claps?\.$/.test(String(q.explain))) { bad.push(`${g}: ${q.explain}`); break; }   // clapped syllables (But ter fly) are not a thought
  }
  ok('early-years explanations never start in the middle of a thought', bad.length === 0, bad.slice(0, 6).join(' | '));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;   // never process.exit(): it can drop the last lines of a piped stdout (2026-09-23)
