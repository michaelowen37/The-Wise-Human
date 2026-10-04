// -----------------------------------------------------------------------------------------------------------------
// Question pools audit (2026-10-01, pass HR, Mikey). In plain terms: for every module, this counts how many different
// questions its question banks can actually produce (sampling each bank many times and counting distinct
// question-and-setup pairs) and compares that with the length of one practice round for that module. A module whose
// pool is smaller than its round would have to repeat questions; the app now shortens such a round instead, and this
// report lists them so their banks can be grown. Run: node tools/question-pools.mjs > docs/QUESTION-POOLS.md
// -----------------------------------------------------------------------------------------------------------------
import { COURSES, GENERATORS, generateQuestion, moduleRules, questionKey } from '../src/logic.mjs';
export function poolSize(generators, samples = 600) {
  const seen = new Set();
  for (const g of new Set(generators)) for (let s = 1; s <= samples; s++) { seen.add(questionKey(generateQuestion(g, s * 7919))); }
  return seen.size;
}
export function shortPools(samples = 600) {
  const rows = [];
  for (const c of COURSES) for (const m of c.modules) {
    if ([...new Set(m.generators)].every((g) => generateQuestion(g, 1).type === 'trace')) continue; // tracing is motor practice; repeats are allowed
    const need = moduleRules(m.id).questions; const have = poolSize(m.generators, samples);
    if (have < need) rows.push({ grade: c.grade, subject: c.subject, course: c.id, module: m.id, title: m.title, have, need });
  }
  return rows;
}
// -----------------------------------------------------------------------------------------------------------------
// Long prompts (2026-10-02, pass HZ). In plain terms: a question's prompt, the sentence the student reads above the
// choices, stays under 70 characters (writing prompts under 110) so it reads at a glance on a phone. The older rules
// test looked at one question per bank, so a long one could hide among a bank's others. This samples every bank the
// same way poolSize does and lists every prompt at or over its limit. A scenario too long for the prompt belongs in
// the question's setup line (its story), which the practice screen shows under the question.
// -----------------------------------------------------------------------------------------------------------------
// longPrompts (pass JE): prompts at or over the limit, 400 characters by default. Before pass JE the limit was 70, or 110
// for writing; Mikey lifted it so questions can carry their context.
export function longPrompts(samples = 600, maxLength = 400) {
  const rows = []; const seen = new Set();
  for (const g of Object.keys(GENERATORS)) for (let s = 1; s <= samples; s++) {
    const q = generateQuestion(g, s * 7919); const limit = maxLength;
    if (typeof q.prompt !== 'string' || q.prompt.length < limit || seen.has(`${g}|${q.prompt}`)) continue;
    seen.add(`${g}|${q.prompt}`); rows.push({ generator: g, prompt: q.prompt, length: q.prompt.length, limit });
  }
  return rows;
}
if (process.argv[1] && process.argv[1].endsWith('question-pools.mjs')) {
  const rows = shortPools();
  const total = COURSES.reduce((a, c) => a + c.modules.length, 0);
  console.log(`# Question pools\n\nGenerated ${new Date().toISOString().slice(0, 10)} by tools/question-pools.mjs. ${rows.length} of ${total} modules can produce fewer different questions than one practice round asks for. The rules test fails on any such module, because a round is never shortened and never repeats a question; a bank that lands here needs more questions, written so every answer is taught in its lesson.\n\n| Grade | Subject | Course | Module | Different questions | Round length |\n|---|---|---|---|---|---|`);
  for (const r of rows) console.log(`| ${r.grade} | ${r.subject} | ${r.course} | ${r.module} | ${r.have} | ${r.need} |`);
  const longs = longPrompts();
  console.log(`\n## Long prompts\n\nA prompt stays under 70 characters, and a writing prompt under 110. ${longs.length} prompts, in every bank sampled, are at or over their limit; the rules test fails on any.\n\n| Bank | Characters | Prompt |\n|---|---|---|`);
  for (const r of longs) console.log(`| ${r.generator} | ${r.length} | ${r.prompt} |`);
}
