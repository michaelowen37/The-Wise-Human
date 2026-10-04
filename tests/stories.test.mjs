// Every story belongs to a real module, fits its band's word limit, has a unique serial, names only
// the core cast, and reads like a story: at least three paragraphs, no em dashes.
import * as L from '../src/logic.mjs';
import { COURSE_STORIES, STORIES, STORY_WORD_LIMIT, COLOR_PAGES } from '../src/stories.mjs';
let pass = 0; let fail = 0;
const ok = (label, cond, detail = '') => { console.log((cond ? 'PASS' : 'FAIL') + ' - ' + label + (cond ? '' : '  ' + detail)); cond ? pass++ : fail++; };
const CORE = ['Mike', 'Chloe', 'Frederick', 'Georgette', 'Savanah', 'Jaxon', 'Harlow'];
const early = new Set(['PK3', 'PK4', 'K', '1', '2']);
const serials = Object.values(STORIES).flatMap((s) => [s.art, ...(s.more || []).map((m) => m.serial)]);
ok('every serial is unique and an S number', new Set(serials).size === serials.length && serials.every((s) => /^S\d+$/.test(s)));
for (const [id, s] of Object.entries(STORIES)) {
  const mod = L.getModule(id); const course = mod && L.getCourse(mod.courseId);
  ok(`${id}: the module exists`, !!course);
  if (!course) continue;
  const words = s.words.join(' ').split(/\s+/).length; const limit = early.has(course.grade) ? STORY_WORD_LIMIT.early : STORY_WORD_LIMIT.older;
  ok(`${id}: ${words} words is under ${limit}`, words <= limit);
  ok(`${id}: three or more paragraphs, a title, an alt line`, s.words.length >= 3 && !!s.title && !!s.alt);
  // The about line feeds the weekly note: "read “Title”, a story about {about}." It must read as a phrase there:
  // lowercase start (a name is fine), no closing punctuation, no "a story" of its own, no double spaces.
  if (s.about !== undefined) ok(`${id}: the about line reads inside the weekly note sentence`, typeof s.about === 'string' && s.about.length > 4 && !/[.!?]$/.test(s.about) && !/^(A|An|The) story/i.test(s.about) && !/  /.test(s.about) && (s.about[0] === s.about[0].toLowerCase() || /^[A-Z][a-z]*[, ]/.test(s.about)), JSON.stringify(s.about));
  ok(`${id}: no em dashes and no sentence over 45 words (a run-on guard; Eleven v4 sets no limit, pass JG)`, !s.words.some((p) => p.includes('\u2014')) && s.words.every((p) => p.split(/[.!?]\s/).every((sent) => sent.split(/\s+/).length <= 45)));
  ok(`${id}: cast names are core characters`, s.cast.every((n) => CORE.includes(n)));
  ok(`${id}: a where line only when the core cast is here, one short line`, !s.where || (s.cast.length > 0 && s.where.length <= 90 && !/\b(was|is|turned) (four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|\d+)\b/.test(s.where)));
  ok(`${id}: no ages in the text (they live in the art prompts)`, !/\b(Mike|Chloe|Frederick|Georgette|Savanah|Jaxon|Harlow) (was|is|turned) (four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|\d+)\b/.test(s.words.join(' ')));
  ok(`${id}: extra pictures point at a paragraph, never two back to back`, (s.more || []).every((m) => /^S\d+$/.test(m.serial) && m.alt && m.after >= 0 && m.after < s.words.length) && new Set((s.more || []).map((m) => m.after)).size === (s.more || []).length);
  ok(`${id}: at most two core characters in one story`, s.cast.length <= 2);
}
// Course stories: one longer story per course, still under the Gladwell ceiling for older readers, with three paragraphs and a scene.
for (const [id, cs] of Object.entries(COURSE_STORIES)) {
  const words = cs.words.join(' ').split(/\s+/).length;
  // A long story is either the original (three paragraphs, under 350 words) or doubled (2026-09-24, Mikey): six or more
  // paragraphs up to 460 words, with five more pictures after five different paragraphs, spread over both halves.
  const doubled = words > 350; const af = (cs.more || []).map((m) => m.after); const half = cs.words.length / 2;
  ok(`${id}: course story has a title, a scene and its length (three paragraphs under 350 words, or doubled to six or more up to 460)`, (doubled ? words <= 460 && cs.words.length >= 6 : words <= 350 && cs.words.length === 3) && !!cs.title && !!cs.alt && /^CS\d+$/.test(cs.art), `${words} words`);
  if (doubled) ok(`${id}: a doubled long story has five more pictures after five different paragraphs in both halves`, af.length === 5 && new Set(af).size === 5 && af.some((a) => a < half) && af.some((a) => a >= half) && af.every((a) => a >= 0 && a < cs.words.length) && cs.more.every((m) => /^CS\d+$/.test(m.serial) && m.alt), af.join(','));
}
// Read-aloud rule for the early years (2026-09-23, Mikey): pre-K to grade 2 stories are spoken to five-year-olds, so no
// sentence runs past eighteen words (twelve until 2026-09-28, when Mikey asked for flowing, varied sentences over clipped
// ones; eighteen still fits one breath) and no word past three syllables (vowel groups, a silent e dropped).
{
  const L = await import('../src/logic.mjs');
  const early = new Set(['PK3', 'PK4', 'K', '1', '2']);
  const syl = (w) => { const x = w.toLowerCase().replace(/[^a-z]/g, ''); if (!x) return 0; let n = (x.match(/[aeiouy]+/g) || []).length; if (/[^aeiouy]e$/.test(x) && !/le$/.test(x) && n > 1) n -= 1; return Math.max(1, n); };
  const bad = [];
  for (const m of L.MODULES) { const st = STORIES[m.id]; const c = L.getCourse(m.courseId); if (!st || !c || !early.has(c.grade)) continue;
    for (const par of st.words) for (const sent of par.split(/(?<=[.!?])\s+/)) { const ws = sent.split(/\s+/).filter(Boolean); if (ws.length > 18) bad.push(`${m.id}: ${ws.length} words`); for (const w of ws) if (syl(w) > 3) bad.push(`${m.id}: ${w}`); } }
  ok('early-years stories read aloud kindly: sentences of eighteen words or fewer, words of three syllables or fewer', bad.length === 0, bad.slice(0, 6).join(' | '));
}
// Course stories spread the cast (2026-09-23, Mikey): in a grade's Let's Read list, two stories side by side never lead
// with the same core character, so nobody meets Georgette three times in a row.
{
  const L = await import('../src/logic.mjs');
  const lead = (title) => (/^(Mike|Chloe|Frederick|Georgette|Savanah)\b/.exec(title) || [])[1] || null;
  const bad = [];
  for (const g of L.GRADES) { const titles = L.spreadLeads(L.COURSES.filter((c) => c.grade === g && COURSE_STORIES[c.id]), (c) => COURSE_STORIES[c.id].title).map((c) => COURSE_STORIES[c.id].title); titles.forEach((t, i) => { if (i && lead(t) && lead(t) === lead(titles[i - 1])) bad.push(`${g}: ${titles[i - 1]} / ${t}`); }); }
  ok('course stories side by side never lead with the same core character, in the order Let\'s Read shows them', bad.length === 0, bad.join(' | '));
  const heavy = []; for (const g of L.GRADES) { const leads = L.COURSES.filter((c) => c.grade === g && COURSE_STORIES[c.id]).map((c) => lead(COURSE_STORIES[c.id].title)).filter(Boolean); const counts = {}; leads.forEach((n) => { counts[n] = (counts[n] || 0) + 1; }); for (const [n, k] of Object.entries(counts)) if (leads.length >= 3 && k > Math.ceil(leads.length / 2)) heavy.push(`${g}: ${n} ${k} of ${leads.length}`); }
  ok('no grade gives one core character more than half of its named course stories', heavy.length === 0, heavy.join(' | '));
}
// The story arc is a hard rule now (2026-09-23, Mikey): every module story has at least four beats, and a story from
// grade 3 up runs eighty words or more (the four-step arc), an early-years story twenty-five or more (the small arc).
{
  const L = await import('../src/logic.mjs');
  const bad = [];
  for (const m of L.MODULES) { const st = STORIES[m.id]; const c = L.getCourse(m.courseId); if (!st || !c) continue;
    const early = ['PK3', 'PK4', 'K', '1', '2'].includes(c.grade); const words = st.words.join(' ').split(/\s+/).filter(Boolean).length;
    if (st.words.length < 4 || words < (early ? 25 : 80)) bad.push(`${m.id}: ${st.words.length} paragraphs, ${words} words`); }
  ok('every module story keeps the arc: four beats, eighty words from grade 3 up, twenty-five in the early years', bad.length === 0, bad.slice(0, 5).join(' | '));
}
// Pictures spread through the story (2026-09-24, Mikey): a story done under the doubling program (three or more extra
// pictures: pre-K four in all, K to 2 five, grade 3 up six) keeps them on different paragraphs with one in each half.
{
  const bad = [];
  for (const [id, st] of Object.entries(STORIES)) { const more = st.more || []; if (more.length < 3) continue;
    const spots = new Set(more.map((m) => m.after)); const half = st.words.length / 2;
    if (spots.size < more.length || !more.some((m) => m.after < half) || !more.some((m) => m.after >= half)) bad.push(`${id}: after ${more.map((m) => m.after).join(',')}`); }
  ok('a story with six pictures spreads them through its paragraphs', bad.length === 0, bad.slice(0, 5).join(' | '));
}
// Coloring pages from lessons (2026-09-24, Mikey): exactly one page for every pre-K to grade 2 lesson and none for older
// ones, serials D28 upward with no gaps or repeats, a plain scene with no numbers in it, and the listing rule: a page shows
// only when its lesson is passed and its art exists.
{
  const earlyIds = L.MODULES.filter((m) => ['PK3', 'PK4', 'K', '1', '2'].includes((L.getCourse(m.courseId) || {}).grade)).map((m) => m.id);
  const pageIds = Object.keys(COLOR_PAGES); const serials = Object.values(COLOR_PAGES).map(([s]) => s);
  ok('every early-years lesson has one coloring page and no older lesson has one', pageIds.length === earlyIds.length && earlyIds.every((id) => COLOR_PAGES[id]), `${pageIds.length} pages, ${earlyIds.length} lessons`);
  ok('lesson coloring pages run D28 upward with no gaps or repeats', serials.every((s, i) => s === `D${28 + i}`), serials.slice(0, 3).join(','));
  ok('every lesson coloring page has a plain scene with no numbers in it', Object.values(COLOR_PAGES).every(([, scene]) => scene && !/\d/.test(scene) && scene.split(/\s+/).length >= 4));
  const first = earlyIds[0]; const has = (s) => s === COLOR_PAGES[first][0];
  ok('a lesson page shows only once its lesson is passed and its art exists', L.lessonColorPages([], has, COLOR_PAGES).length === 0 && L.lessonColorPages([first], has, COLOR_PAGES).join() === `lesson-${first}` && L.lessonColorPages([earlyIds[1]], has, COLOR_PAGES).length === 0);
  ok('a lesson page is titled by its lesson', L.pictureTitle(`lesson-${first}`) === L.MODULES.find((m) => m.id === first).title);
}

// Early-years stories flow (2026-09-28, Mikey): every story from pre-K 3 to grade 2 reads the way a picture book reads
// aloud, connected and varied, never a run of clipped lines. The rules are the flow audit's; this holds them at zero.
{
  const L = await import('../src/logic.mjs');
  const { flowFlags } = await import('../tools/story-flow.mjs');
  const early = new Set(['PK3', 'PK4', 'K', '1', '2']);
  const bad = [];
  for (const m of L.MODULES) { const st = STORIES[m.id]; const c = L.getCourse(m.courseId); if (!st || !c || !early.has(c.grade)) continue;
    st.words.forEach((p, i) => { const f = flowFlags(p, { moral: i === st.words.length - 1 }); if (f.flags.length) bad.push(`${m.id} paragraph ${i + 1}: ${f.flags.join(', ')}`); }); }
  ok('early-years stories flow: no paragraph reads robotic (choppy, monotone, then then)', bad.length === 0, bad.slice(0, 6).join(' | '));
}

// Every story lists on the Story Log and pages into the book with its pictures (2026-09-28, Mikey, pass FR). The Story Log
// asks logic (storyLogAvailable, recentReads) what a student has, and the book asks logic (bookPages) for its pages, so
// this test walks every course the way the screens do: a fresh student sees every module story unread and every long
// story locked; reading one moves it to Read and to Most recent, newest first; and the book, paged twice (nothing painted,
// everything painted), holds every paragraph exactly once, in order, with each picture on the same sheet as its
// paragraph, and no sheet fuller than the paper.
{
  const L = await import('../src/logic.mjs');
  const S = await import('../src/stories.mjs');
  const fresh = L.storyLogAvailable([], S.storyFor, S.courseStoryFor);
  const shortIds = new Set(fresh.shorts.map((s) => s.moduleId)); const longIds = new Set(fresh.longs.map((l) => l.courseId));
  const missingShort = Object.keys(STORIES).filter((id) => !shortIds.has(id));
  ok('a fresh student\'s Story Log lists every module story, each unread', missingShort.length === 0 && fresh.shorts.every((s) => s.at === null) && fresh.shorts.length === Object.keys(STORIES).length, missingShort.slice(0, 5).join(','));
  const missingLong = Object.keys(COURSE_STORIES).filter((id) => !longIds.has(id));
  ok('a fresh student\'s Story Log lists every long story, locked with every module still to master', missingLong.length === 0 && fresh.longs.every((l) => !l.unlocked && l.at === null && l.left === L.getCourse(l.courseId).modules.length && l.left > 0), missingLong.slice(0, 5).join(','));
  ok('every long story belongs to a real course with modules', Object.keys(COURSE_STORIES).every((id) => L.getCourse(id) && L.getCourse(id).modules.length > 0), Object.keys(COURSE_STORIES).filter((id) => !L.getCourse(id)).join(','));
  ok('every story shows a title on the Story Log', Object.values(STORIES).every((st) => L.titleCase(st.title).trim().length > 0) && Object.values(COURSE_STORIES).every((st) => String(st.title).trim().length > 0));
  // Reading moves a story: first opening counts, Most recent is today's reading or the last three, newest first.
  const ids = Object.keys(STORIES).slice(0, 5); const cid = Object.keys(COURSE_STORIES)[0];
  const evs = ids.map((id, i) => L.makeStoryReadEvent(id, `2026-09-0${i + 1}T10:00:00.000Z`)).concat([L.makeStoryReadEvent(ids[0], '2026-09-09T10:00:00.000Z'), L.makeStoryReadEvent(`course:${cid}`, '2026-09-10T10:00:00.000Z')]);
  const after = L.storyLogAvailable(evs, S.storyFor, S.courseStoryFor);
  ok('a story read moves to Read at its first opening, and a long story read is marked read', ids.every((id) => (after.shorts.find((s) => s.moduleId === id) || {}).at) && (after.shorts.find((s) => s.moduleId === ids[0]) || {}).at === '2026-09-01T10:00:00.000Z' && after.shorts.filter((s) => s.at).length === 5 && !!(after.longs.find((l) => l.courseId === cid) || {}).at);
  const recent = L.recentReads(evs, new Date('2026-09-20T12:00:00.000Z'));
  ok('Most recent with nothing read today is the last three stories opened, newest first', recent.length === 3 && recent[0].moduleId === `course:${cid}` && recent[1].moduleId === ids[4] && recent[2].moduleId === ids[3], recent.map((r) => r.moduleId).join(','));
  const today = new Date(); const stamp = new Date(today.getTime() - 60000).toISOString();
  const todays = L.recentReads(evs.concat([L.makeStoryReadEvent(Object.keys(STORIES)[6], stamp)]), today);
  ok('Most recent shows today\'s reading when there is any', todays.length === 1 && todays[0].at === stamp, todays.map((r) => r.moduleId).join(','));
  // The book, twice over: nothing painted (pairs of short stories share a sheet) and everything painted (every story on
  // sheets of its own). A page is a part of one story: its paragraphs run in order with no gap, every picture's paragraph
  // is on that page, the first page carries the title and main picture, and the sheet is never fuller than the paper.
  const P = L.PRINT_PAGE; const bad = []; let pages = 0; let courses = 0;
  const checkStory = (label, st, parts, painted) => {
    if (!parts.length) { bad.push(`${label}: no pages`); return; }
    let next = 0;
    parts.forEach((part, k) => {
      if (part.head !== (k === 0)) bad.push(`${label}: page ${k + 1} ${part.head ? 'repeats the title' : 'has no title'}`);
      if (part.from !== next || part.to < part.from) bad.push(`${label}: page ${k + 1} runs ${part.from} to ${part.to}, expected to start at ${next}`);
      if (part.used > P.room + 0.001) bad.push(`${label}: page ${k + 1} needs ${part.used} inches of ${P.room}`);
      next = part.to + 1;
    });
    if (next !== st.words.length) bad.push(`${label}: pages end at paragraph ${next} of ${st.words.length}`);
    // Every picture lands on the page of its own paragraph: no paragraph is parted from its picture.
    for (const m of st.more || []) { const page = parts.findIndex((p) => m.after >= p.from && m.after <= p.to); if (page < 0) bad.push(`${label}: picture ${m.serial} after paragraph ${m.after} is on no page`); }
  };
  for (const c of L.COURSES) {
    const chapters = c.modules.map((m) => ({ m, st: STORIES[m.id] })).filter((x) => x.st); const cs = COURSE_STORIES[c.id] || null;
    if (!chapters.length && !cs) continue;
    courses += 1;
    for (const painted of [false, true]) {
      const { groups, csParts } = L.bookPages(chapters, cs, () => painted);
      // Each chapter appears once, in course order, its parts on consecutive pages; two stories share a page only unpainted.
      const seen = groups.flatMap((g) => g.items.map((it) => it.i));
      const order = chapters.map((_, i) => i); const heads = groups.flatMap((g) => g.items.filter((it) => !it.part || it.part.head).map((it) => it.i));
      if (heads.join(',') !== order.join(',')) bad.push(`${c.id}${painted ? ' painted' : ''}: chapters ${heads.join(',')} for ${order.join(',')}`);
      if (painted && groups.some((g) => g.items.length > 1)) bad.push(`${c.id} painted: two stories on one sheet`);
      if (groups.some((g) => g.items.length > g.per || g.items.length === 0)) bad.push(`${c.id}${painted ? ' painted' : ''}: a sheet holds more than its share`);
      chapters.forEach((ch, i) => { const parts = groups.flatMap((g) => g.items.filter((it) => it.i === i).map((it) => it.part || { head: true, from: 0, to: ch.st.words.length - 1, used: 0 })); checkStory(`${c.id}/${ch.m.id}${painted ? ' painted' : ''}`, ch.st, parts, painted); });
      if (cs) checkStory(`${c.id}/long${painted ? ' painted' : ''}`, cs, csParts, painted);
      if (seen.length < chapters.length) bad.push(`${c.id}: ${seen.length} placements for ${chapters.length} chapters`);
      if (painted) pages += groups.length + csParts.length;
    }
  }
  ok(`every course's book pages every story with its pictures, painted or not (${courses} courses, ${pages} painted sheets)`, bad.length === 0 && courses === L.COURSES.filter((c) => c.modules.some((m) => STORIES[m.id]) || COURSE_STORIES[c.id]).length, bad.slice(0, 6).join(' | '));
  // A paragraph with its picture always fits a sheet of its own, so the book never has to part them.
  const tall = [];
  for (const [id, st] of [...Object.entries(STORIES), ...Object.entries(COURSE_STORIES).map(([k, v]) => [`long:${k}`, v])]) {
    st.words.forEach((par, i) => { const parts = L.printParts([par], [0], true); if (parts.length !== 1 || parts[0].used > P.room) tall.push(`${id} paragraph ${i + 1}: ${parts[0] ? parts[0].used : '?'} inches`); });
  }
  ok('every paragraph fits one sheet beside its picture, under the title and main painting', tall.length === 0, tall.slice(0, 5).join(' | '));
}

// Audio tags (pass JH): a story's `audio` is its `words` with Eleven v4 tags added and nothing else changed, the words never
// carry a tag, and every story fits one Eleven v4 request (10,000 characters).
{
  const stripTags = (p) => String(p).replace(/\[[^\]]*\]\s*/g, '').replace(/\s+/g, ' ').trim();
  const all = Object.entries(STORIES);
  const tagged = all.filter(([, s]) => s.audio);
  ok(`tagged stories keep their words exactly (${tagged.length} tagged)`, tagged.every(([, s]) => s.audio.length === s.words.length && s.audio.every((p, i) => stripTags(p) === s.words[i].replace(/\s+/g, ' ').trim())));
  ok('no story shows a tag to readers', all.every(([, s]) => s.words.every((p) => !/[\[\]]/.test(p))));
  ok('every tag is a short phrase in one pair of brackets', tagged.every(([, s]) => s.audio.every((p) => (p.match(/\[[^\[\]]{1,60}\]/g) || []).length === (p.match(/\[/g) || []).length)));
  ok('every story fits one Eleven v4 request of 10,000 characters', all.every(([, s]) => (s.audio || s.words).join(' ').length + s.title.length < 9000));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;   // never process.exit(): it can drop the last lines of a piped stdout (2026-09-23)
