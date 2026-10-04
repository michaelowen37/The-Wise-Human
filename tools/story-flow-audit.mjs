// Story flow audit (2026-09-28, Mikey): stories must read the way a good author writes, conversational and fluid, with
// sentence lengths that vary (short, medium, long, medium) rather than a run of clipped lines written to match pictures.
// This lists every paragraph that reads robotic: a run of three or more sentences of six words or fewer (choppy), a run of
// four or more sentences all within three words of the same length (monotone), or two sentences in a row starting with
// Then. The rules live in tools/story-flow.mjs. Run: node tools/story-flow-audit.mjs > docs/STORY-FLOW.md
import { STORIES, COURSE_STORIES } from '../src/stories.mjs';
import { COURSES, MODULES } from '../src/logic.mjs';

const gradeOf = (moduleId) => { const c = COURSES.find((k) => k.modules.some((m) => m.id === moduleId)); return c ? c.grade : '?'; };
const courseGrade = (courseId) => { const c = COURSES.find((k) => k.id === courseId); return c ? c.grade : '?'; };
import { flowFlags } from './story-flow.mjs';

const rows = [];
for (const [id, st] of Object.entries(STORIES)) {
  const grade = gradeOf(id); const hits = [];
  st.words.forEach((p, i) => { const f = flowFlags(p, { moral: i === st.words.length - 1 }); if (f.flags.length) hits.push({ i, flags: f.flags, lens: f.lens }); });
  rows.push({ kind: 'story', id, grade, title: st.title, hits, paragraphs: st.words.length });
}
for (const [id, st] of Object.entries(COURSE_STORIES)) {
  const grade = courseGrade(id); const hits = [];
  st.words.forEach((p, i) => { const f = flowFlags(p, { moral: i === st.words.length - 1 }); if (f.flags.length) hits.push({ i, flags: f.flags, lens: f.lens }); });
  rows.push({ kind: 'long', id, grade, title: st.title, hits, paragraphs: st.words.length });
}
const order = ['PK3', 'PK4', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'college', '?'];
const gk = (g) => { const i = order.indexOf(String(g)); return i < 0 ? 99 : i; };
rows.sort((a, b) => gk(a.grade) - gk(b.grade) || a.id.localeCompare(b.id));
const flagged = rows.filter((r) => r.hits.length);
const out = [];
out.push('# Story flow audit', '', `Generated ${new Date().toISOString().slice(0, 10)}. ${flagged.length} of ${rows.length} stories have at least one paragraph that reads robotic (choppy: three or more sentences in a row of six words or fewer; monotone: four or more sentences in a row within three words of one length; then, then: two sentences in a row starting with Then). A story's closing moral, a short refrain by design, is exempt from the choppy rule, and single-word sentences (a sound, a shout, a beat) do not count toward it. Pre-K 3 to grade 2 are held at zero by a rule test. Grades 3 and up were read by hand on 2026-09-28 (pass FQ): the flags that remain there are deliberate short sentences, lists, dialogue or step sequences, kept on purpose, so a flag from grade 3 up is a prompt to read, not an order to rewrite.`, '');
out.push('## By grade', '', '| Grade | Stories | Flagged | Paragraphs flagged |', '|---|---|---|---|');
for (const g of order) { const rs = rows.filter((r) => String(r.grade) === g); if (!rs.length) continue; const fl = rs.filter((r) => r.hits.length); out.push(`| ${g} | ${rs.length} | ${fl.length} | ${fl.reduce((n, r) => n + r.hits.length, 0)} |`); }
out.push('', '## Flagged stories', '', '| Grade | Kind | Story | Paragraph | Why | Sentence lengths |', '|---|---|---|---|---|---|');
for (const r of flagged) for (const h of r.hits) out.push(`| ${r.grade} | ${r.kind} | ${r.id} | ${h.i + 1} of ${r.paragraphs} | ${h.flags.join(', ')} | ${h.lens.join(', ')} |`);
console.log(out.join('\n'));
