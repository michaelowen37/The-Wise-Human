// Writes docs/GAMES-PLAN.md from the games themselves (2026-09-25), so the plan can never drift from what the app holds:
// every course and its games, the two ceilings the rules test holds, and where the new kinds stand.
// Run: node tools/games-plan.mjs
import { writeFileSync } from 'node:fs';
import * as L from '../src/logic.mjs';

const byId = new Map(L.GAMES.map((g) => [g.id, g]));
const kindOf = (id) => (byId.get(id) || {}).kind;
let repeats = 0; for (const gr of L.GRADES) { const ks = L.COURSES.filter((c) => c.grade === gr).flatMap((c) => (L.COURSE_GAMES[c.id] || []).map(kindOf)); repeats += ks.length - new Set(ks).size; }
const doubles = L.COURSES.filter((c) => { const ks = (L.COURSE_GAMES[c.id] || []).map(kindOf); return ks.length !== new Set(ks).size; }).map((c) => c.id);
const quick = Object.values(L.COURSE_GAMES).flat().filter((id) => kindOf(id) === 'sprint').length;
const kinds = new Set(L.GAMES.map((g) => g.kind));
const holders = (kind) => L.COURSES.filter((c) => (L.COURSE_GAMES[c.id] || []).some((id) => kindOf(id) === kind)).map((c) => c.title);
const rows = [];
for (const gr of L.GRADES) for (const c of L.COURSES.filter((x) => x.grade === gr)) rows.push(`| ${gr} | ${c.title} | ${(L.COURSE_GAMES[c.id] || []).map((id) => `${(byId.get(id) || { title: id }).title} (${kindOf(id)})`).join(', ')} |`);
const out = `# Games plan

Written by tools/games-plan.mjs from the app's own lists; run it again after any change to the games. Every course has its own game, or two, chosen to suit its subject and grade; finishing the course unlocks them. Inside a grade the same kind is avoided wherever today's kinds allow. A course that no game suits yet has a quick fire of its own lessons, and so does a history course whose only game is a map still waiting for its painting.

Starter, open from the first day: Star. Kinds of game: ${kinds.size}. Quick fires still standing in for a game: ${quick}. Kinds repeated inside a grade: ${repeats}. Courses holding two games of one kind: ${doubles.join(', ') || 'none'}. The rules test holds both numbers as ceilings, so each new kind must bring them down.

## New kinds, in order

Each new kind should make the course's idea the rule of the game, so playing is practicing. They replace quick fires and repeats first.

1. Sentence builder, for writing (built 2026-09-25): tap word tiles into a sentence that makes sense, then into one that says more. Held by ${holders('build').join(', ')}.
2. Fix it, for writing (built 2026-09-25): tap the one word, capital or mark that is wrong in a sentence, then read the rule. Held by ${holders('fix').join(', ')}.
3. Color mixer, for art (built 2026-09-25): tap two paint pots to make a named color, primaries to secondaries, tints, shades and the intermediate colors; a wrong mix shows what it really made. Held by ${holders('mix').join(', ')}.
4. Debug the robot, for technology (built 2026-09-25): a robot follows a program on a grid; find the one wrong step, change it and run again until it reaches the star. Arrows for grade 3, forward and turns for grade 5, each puzzle checked to have exactly one single-step fix. Held by ${holders('debug').join(', ')}, beside their first games.
5. Timelines for the history grades (built 2026-09-25), using the order kind with new decks: Texas, early civilizations, inventions and buildings, the United States to 1877 and since, world history, and how our government grew. Each date shows once its set is in order. World geography, Thinking like a historian and Communities and government keep their quick fires, since a timeline does not fit them.
6. The periodic table, for chemistry (built 2026-09-25): find an element on the main-group table by its name, protons, place or family, with the fact about it shown after each find. Held by ${holders('ptable').join(', ')}. The element symbols pairs game left physics, so no course holds two games of one kind.
7. Find the evidence, for reading (built 2026-09-25): read a short original passage and tap the one sentence that answers the question, then read why it is the evidence. Held by ${holders('evidence').join(', ')}, in place of their quick fires.

## Every course and its games

| Grade | Course | Games |
|---|---|---|
${rows.join('\n')}
`;
writeFileSync(new URL('../docs/GAMES-PLAN.md', import.meta.url), out);
console.log(`games plan written: ${rows.length} courses, ${kinds.size} kinds, ${quick} quick fires, ${repeats} repeats, doubles ${doubles.join(', ') || 'none'}`);
