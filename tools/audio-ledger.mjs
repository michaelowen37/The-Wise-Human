// The audio ledger (2026-10-04, pass JH, Mikey). In plain terms: every clip the app can play in a recorded voice, with the exact
// words to send to ElevenLabs' Eleven v4 model, its audio tags, and the file name the app already looks for (audio/<key>.mp3).
// Stories play paragraph by paragraph, so each paragraph is a clip (S95-0 is a story's title, S95-1 its first paragraph);
// pre-reader lessons play sentence by sentence (red-and-blue-0-1 is the lesson's line 0, sentence 1). Tags shape the voice and
// never reach the screen: a story may carry hand-written tags in its `audio` field (src/stories.mjs), and every clip starts with
// the voice direction for its age band. Every clip, and every whole story, stays far under Eleven v4's 10,000 characters.
// Run: node tools/audio-ledger.mjs > docs/AUDIO-LEDGER.md   (it also writes docs/AUDIO-LEDGER.csv, which tools/audio-generate.mjs reads)
import { writeFileSync } from 'node:fs';
import { COURSES, readAloudScript } from '../src/logic.mjs';
import { STORIES, COURSE_STORIES } from '../src/stories.mjs';

// Voices by age (Mikey, pass JH). The directions are short on purpose: one opens every clip, and ElevenLabs counts tags as characters.
// Voices by age (Mikey, pass JH): warm and pleasant everywhere, never over-excited; young learners hear words drawn out and
// stressed the way a favorite preschool teacher says them; older learners hear a warm, engaging voice that never talks down.
const band = (g) => { const s = String(g); if (/^pk/i.test(s) || /^k$/i.test(s) || s === '1' || s === '2') return 'early'; if (['3', '4', '5'].includes(s)) return 'elementary'; if (['6', '7', '8'].includes(s)) return 'middle'; return 'older'; };
export const DIRECTION = {
  early: '[warm and gentle, drawing out key words]',
  elementary: '[warm and friendly]',
  middle: '[warm and natural]',
  older: '[warm, conversational]',
  title: '[warm]',
  question: '[warm, pleasant, mildly upbeat]',
};
const sentencesOf = (t) => String(t || '').split(/(?<=[.!?])\s+/).filter(Boolean);   // the same split the app uses (src/ui.jsx)
const rows = [];
const add = (key, kind, source, grade, text, plain, group) => rows.push({ key, kind, source, grade: String(grade), voice: band(grade) === 'early' ? 'young' : 'main', text, plain, group });
// Pre-K first, then up (the review's order), so the ledger reads in the order the review tags it.
const rank = (g) => { const s = String(g); if (/^pk3$/i.test(s)) return 0; if (/^pk/i.test(s)) return 1; if (/^k$/i.test(s)) return 2; if (/^\d+$/.test(s)) return 2 + Number(s); return 15; };
const courses = [...COURSES].sort((a, b) => rank(a.grade) - rank(b.grade) || (a.elective ? 1 : 0) - (b.elective ? 1 : 0));
for (const c of courses) {
  for (const m of c.modules) {
    const st = STORIES[m.id];
    if (st) {
      add(`${st.art}-0`, 'story title', m.id, c.grade, `${DIRECTION.title} ${st.title}.`, `${st.title}.`, st.art);
      st.words.forEach((p, i) => add(`${st.art}-${i + 1}`, 'story', m.id, c.grade, `${DIRECTION[band(c.grade)]} ${(st.audio && st.audio[i]) || p}`, p, st.art));
    }
    // A read-aloud lesson speaks readAloudScript's lines (pass JP: paragraphs too when it has no script), keyed by step as the app plays them.
    (c.readAloud ? readAloudScript(m) : (m.lesson && m.lesson.script ? m.lesson.script : [])).forEach((line, li) => sentencesOf(line.say).forEach((s, si) => add(`${m.id}-${li}-${si}`, 'lesson line', m.id, c.grade, `${DIRECTION.early} ${s}`, s, `${m.id}-lesson`)));
  }
  const cs = COURSE_STORIES[c.id];
  if (cs) {
    add(`${cs.art}-0`, 'long story title', c.id, c.grade, `${DIRECTION.title} ${cs.title}.`, `${cs.title}.`, cs.art);
    (cs.words || []).forEach((p, i) => add(`${cs.art}-${i + 1}`, 'long story', c.id, c.grade, `${DIRECTION[band(c.grade)]} ${(cs.audio && cs.audio[i]) || p}`, p, cs.art));
  }
}
const csv = (v) => `"${String(v).replace(/"/g, '""')}"`;
writeFileSync(new URL('../docs/AUDIO-LEDGER.csv', import.meta.url), ['key,kind,source,grade,voice,group,characters,text', ...rows.map((r) => [r.key, r.kind, r.source, r.grade, r.voice, r.group, r.text.length, r.text].map(csv).join(','))].join('\n') + '\n');
const longest = Math.max(...rows.map((r) => r.text.length));
const groups = new Map(); for (const r of rows) groups.set(r.group, (groups.get(r.group) || 0) + r.text.length);
const tagged = Object.values(STORIES).filter((s) => s.audio).length + Object.values(COURSE_STORIES).filter((s) => s.audio).length;
const chars = rows.reduce((a, r) => a + r.text.length, 0);
console.log(`# Audio ledger

Generated ${new Date().toISOString().slice(0, 10)} by tools/audio-ledger.mjs. Every clip the app can play in a recorded voice is a row of docs/AUDIO-LEDGER.csv: its key (the file name, audio/<key>.mp3, that the app already looks for), its group (the story or lesson it belongs to) and the words with their Eleven v4 audio tags. ${rows.length} clips, ${chars.toLocaleString('en-US')} characters in all; the longest clip is ${longest} characters and the longest whole story ${Math.max(...groups.values()).toLocaleString('en-US')}, far under Eleven v4's 10,000 a request. ${tagged} stories carry hand-written tags so far (the writing review adds them course by course); the rest open with their age band's voice direction only.

## How to make the audio

The quickest way is one command. tools/audio-generate.mjs reads the CSV and, for each clip not yet in audio/, asks Eleven v4 (model eleven_v4) to speak the tagged words, passing the words before and after (previous_text and next_text) so a story sounds like one steady telling, and saves audio/<key>.mp3. It skips clips that already exist, so it can be stopped and started again. The app plays recorded clips in place of the device voice as soon as every clip of a story or lesson line is present; until then it keeps the device voice.

    ELEVENLABS_API_KEY=your-key node tools/audio-generate.mjs --voice <voice id> --voice-young <voice id for pre-K to grade 2>
    (add --only S95 for one story, --limit 50 to try a few, --dry-run to see what would be sent)

Pasting into the ElevenLabs app works too, clip by clip, with the text column as written and each file saved as <key>.mp3.

## Characters by age band

ElevenLabs counts characters, tags included, so this is the size of each part of the job.

| Band | Clips | Characters |
|---|---|---|
${['early', 'elementary', 'middle', 'older'].map((b) => { const rs = rows.filter((r) => band(r.grade) === b); return `| ${{ early: 'Pre-K to grade 2', elementary: 'Grades 3 to 5', middle: 'Grades 6 to 8', older: 'Grades 9 to college' }[b]} | ${rs.length} | ${rs.reduce((a, r) => a + r.text.length, 0).toLocaleString('en-US')} |`; }).join('\n')}

## Voices

| Who | Direction at the start of each clip |
|---|---|
| Pre-K to grade 2, and every pre-reader lesson line | ${DIRECTION.early} |
| Grades 3 to 5 | ${DIRECTION.elementary} |
| Grades 6 to 8 | ${DIRECTION.middle} |
| Grades 9 to college | ${DIRECTION.older} |
| Story titles | ${DIRECTION.title} |
| Questions (when the app plays them; next in the audio work) | ${DIRECTION.question} |

Questions stay warm, pleasant and mildly upbeat, never over-excited. Young learners hear words drawn out and stressed the way a favorite preschool teacher says them; older learners hear a warm, engaging voice that never talks down to them (Mikey, pass JH).

## Clips by kind

| Kind | Clips |
|---|---|
${[...new Set(rows.map((r) => r.kind))].map((k) => `| ${k} | ${rows.filter((r) => r.kind === k).length} |`).join('\n')}

## Stories with hand-written tags

${Object.entries(STORIES).filter(([, s]) => s.audio).map(([id, s]) => `### ${s.title} (${s.art}, ${id})\n\n${s.audio.map((p, i) => `- ${s.art}-${i + 1}: ${p}`).join('\n')}`).join('\n\n')}
`);
