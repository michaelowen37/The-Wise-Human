// A promise kept as a test: a backup file made today must restore on every future
// version of EduSphere. Never edit or delete a fixture. When the format changes, add a
// new fixture alongside the old ones and make the code read both.
import { readFileSync, readdirSync } from 'node:fs';
import * as L from '../src/logic.mjs';

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; console.log('PASS -', name); } else { fail++; console.log('FAIL -', name); } };

const files = readdirSync('tests/fixtures').filter((f) => /^backup-v\d+-.*\.json$/.test(f)).sort();
ok('at least one backup fixture exists', files.length >= 1);
for (const f of files) {
  const data = JSON.parse(readFileSync(`tests/fixtures/${f}`, 'utf8'));
  ok(`${f}: still passes the safety check`, L.checkBackup(data) === null);
  const empty = { roster: L.emptyRoster(), records: [], wonderReview: L.emptyWonderReview(), covered: L.emptyCoveredSkills() };
  const merged = L.mergeBackup(empty, data);
  ok(`${f}: every student comes back`, merged.roster.students.length === data.roster.students.length);
  ok(`${f}: every record comes back with all its events`, merged.records.every((r) => data.records.find((x) => x.name === r.name).events.length === r.events.length));
  ok(`${f}: the report can still be built from a restored record`, merged.records.every((r) => L.buildReport(r.name, r.events).modules.length > 0));
  ok(`${f}: mastery is preserved after restore`, L.deriveProgress(merged.records.find((r) => r.name === 's_1042').events).masteredIds.includes('count-to-5'));
  ok(`${f}: educator settings come back`, merged.wonderReview.approved.length > 0 && merged.covered.covered.length > 0);
  ok(`${f}: pictures and levels survive`, merged.roster.students.some((st) => st.picture === 'fox' && st.level === 'early'));
  // Everything the screens derive from a restored record still runs, and restoring into a classroom
  // that already uses newer fields keeps those fields.
  const derive = () => merged.records.every((r) => { L.coloringUnlocked(r.events); L.gamesUnlocked(r.events); L.completedGrades(r.events); L.studentSummary(r.events, merged.roster.students.map((s) => s.id)); for (const m of L.MODULES.slice(0, 40)) L.moduleStory(r.name, r.events, m.id); return true; });
  ok(`${f}: every derivation the screens use runs on the restored record`, (() => { try { return derive(); } catch (e) { console.log('   ', e.message); return false; } })());
  const today = { roster: L.setStudentPin(L.setClassroomOrder(L.addStudent(L.emptyRoster(), 'S-new', 't', { level: 'elementary', pin: '1234', wonder: false }).roster, ['S-new']), 'S-new', '1234'), records: [], wonderReview: L.emptyWonderReview(), covered: L.emptyCoveredSkills() };
  const both = L.mergeBackup(today, data);
  const kept = L.findStudent(both.roster, 'S-new');
  ok(`${f}: restoring into today's classroom keeps the newer student fields`, !!kept && kept.pin === '1234' && kept.wonder === false && kept.order === 0 && both.roster.students.length === data.roster.students.length + 1);
  ok(`${f}: the certificate helpers accept a restored student with no certificate field`, Array.isArray(L.certificatesPending(both.roster.students.find((s) => s.id !== 'S-new'), ['K'])));
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;   // never process.exit(): it can drop the last lines of a piped stdout (2026-09-23)
