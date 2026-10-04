// The curriculum map, checked. Fails only for grades marked ready; reports gaps for the rest.
import * as L from '../src/logic.mjs';
import { CURRICULUM, FRAMEWORKS, STATES, coverageReport, frameworkForState } from '../src/curriculum.mjs';

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; console.log('PASS -', name); } else { fail++; console.log('FAIL -', name); } };

const { rows, orphans } = coverageReport(L.MODULES);

ok('every plan names its published sources', CURRICULUM.every((p) => /TEKS|Texas/.test(p.source) && /Common Core|Head Start|Next Generation Science|National Council for the Social Studies|American Psychological Association|Council for Economic Education|National Communication Association/.test(p.source)));
ok('every standard names a framework the platform knows', CURRICULUM.every((p) => p.standards.every((st) => FRAMEWORKS[st.framework])));
ok('every state and the District of Columbia are listed with a framework', STATES.length === 51 && STATES.every((st) => FRAMEWORKS[st.framework]));
ok('Texas builds to TEKS and California to Common Core', frameworkForState('TX') === 'TEKS' && frameworkForState('CA') === 'CCSS');
ok('every plan carries both frameworks', CURRICULUM.every((p) => p.standards.some((st) => st.framework === 'TEKS') && p.standards.some((st) => st.framework === 'CCSS')));
ok('every module a plan names really exists', rows.every((r) => r.unknown.length === 0));
ok('every module belongs to at least one standard', orphans.length === 0);
ok('no prerequisite is missing and no chain loops back on itself', L.checkPrerequisiteGraph().length === 0);
for (const fw of Object.keys(FRAMEWORKS)) {
  for (const r of coverageReport(L.MODULES, fw).rows) {
    const label = `${fw} ${L.gradeLabel(r.grade)} ${r.subject}: ${r.covered} of ${r.total} standards covered`;
    // Ready is enforced against TEKS, the first framework we build to; Common Core gaps are reported.
    if (r.status === 'ready' && fw === 'TEKS') ok(label + ' (marked ready, so all must be)', r.missing.length === 0);
    else console.log('NOTE -', label, r.missing.length ? `still needs: ${r.missing.join(', ')}` : '');
  }
}
if (orphans.length) console.log('orphans:', orphans.join(', '));
// Reflections keep pace with the curriculum: a note for every stage where the pool is
// thinner than one question per module, and a check that every theme is represented.
for (const stage of ['early', 'growing', 'teen', 'grown']) {
  const modules = L.MODULES.filter((m) => L.stageForGrade(L.getCourse(m.courseId).grade) === stage).length;
  const questions = L.WONDER.filter((w) => (w.stage || 'early') === stage).length;
  if (modules === 0) continue;
  const line = `reflections for the ${stage} stage: ${questions} questions for ${modules} modules`;
  if (questions >= modules) ok(line, true); else console.log('NOTE -', line, `(write ${modules - questions} more to reach one per module)`);
  const themes = new Set(L.WONDER.filter((w) => (w.stage || 'early') === stage).map((w) => w.theme));
  ok(`every theme is represented in the ${stage} pool`, Object.keys(L.WONDER_THEMES).every((t) => themes.has(t)));
}
ok('every reflection carries a known theme', L.WONDER.every((w) => L.WONDER_THEMES[w.theme]));
// The transcript names the standards a finished course satisfied; every course must map to at least one code in each framework.
for (const c of L.COURSES) for (const fw of ['TEKS', 'CCSS']) {
  const ids = c.modules.map((m) => m.id);
  const codes = CURRICULUM.flatMap((e) => e.standards.filter((st) => st.framework === fw && st.moduleIds.some((id) => ids.includes(id))).map((st) => st.code));
  ok(`${c.id} has standards satisfied to show on a transcript (${fw})`, codes.length > 0);
}

// A plan never repeats a code: two lines with one code print twice on the map and split the modules that satisfy it.
const repeats = [];
for (const plan of CURRICULUM) { const seen = new Set(); for (const st of plan.standards) { const key = `${st.framework}:${st.code}`; if (seen.has(key)) repeats.push(`${plan.grade} ${plan.subject} ${key}`); seen.add(key); } }
ok('no plan repeats a code', repeats.length === 0, repeats.join(', '));
console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;   // never process.exit(): it can drop the last lines of a piped stdout (2026-09-23)
