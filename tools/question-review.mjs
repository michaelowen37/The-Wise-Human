// Copyright (c) 2026 iECHO, LLC. All rights reserved.
// -----------------------------------------------------------------------------------------------------------------
// Question review (2026-10-02, pass IB, Mikey: "review all questions and answers throughout to ensure everything
// makes sense when read by a human"). In plain terms: this prints every practice question the way a student meets it
// on the practice screen, in that order (the question first, then its setup line, then the choices, then the
// explanation shown after answering), so a person can read a whole grade like a book and catch anything that reads
// badly. Computed banks make thousands of versions of the same question, so the sheet shows a few of each pattern and
// the wording checks below read every version.
//
// The wording checks (`wordingFlags`) catch the mechanical slips a human reader trips on: a question that ends in a
// fragment (The model?), a question that leans on its setup with "that" when the setup sits under it, an explanation
// that starts mid-thought (Which often match...), "1 beats", "a 8", a doubled word, and choices that do not hold the
// answer exactly once. They are a net, not the review: every sheet is still read in full.
//
// Run: node tools/question-review.mjs --grade K        (a review sheet for one grade, as markdown)
//      node tools/question-review.mjs --flags           (every flagged question in the app)
// -----------------------------------------------------------------------------------------------------------------
import { COURSES, generateQuestion, describeChoice } from '../src/logic.mjs';

// Words that make a short closing sentence a real question rather than a fragment. A closing sentence of four words or
// fewer with none of these ("The model?", "Purpose?", "Chance of shaded?") is flagged.
const VERBS = /\b(is|are|was|were|be|been|am|do|does|did|can|could|will|would|should|shall|may|might|must|has|have|had|go|goes|come|comes|mean|means|make|makes|take|takes|show|shows|happen|happens|need|needs|say|says|get|gets|see|sees|know|knows|live|lives|grow|grows|fit|fits|win|wins|left|cost|costs|weigh|weighs|feel|feels|look|looks|work|works|tell|tells|belong|belongs|start|starts|end|ends|matter|matters)\b/i;
// A closing word that leaves the question hanging ("The cone holds?", "Famished means?", "Change one, and?").
const TRAILING = /(\b(and|or|holds|becomes|means|equals)\?$)|(\b(the|a|an)\?$)/;
// Prompts that begin by asking the student to do something need no question mark.
const IMPERATIVE = /^(tap|draw|put|find|choose|pick|trace|say|count|listen|look|drag|match|sort|write|type|order|show|make|color|circle|move|fill|point|name|give|tell|read|spell|clap|hear|copy|connect|join|build|place|use|follow|help|ask|explain|describe|compare|solve|round|add|subtract|multiply|divide|estimate|measure|plot|graph|label|mark|select|press|hold|turn|start|finish|complete|check|think|guess|find|keep|set|try|play|sing|step|walk|jump|stomp|factor|simplify|evaluate|expand)\b/i;
// Plural words after a lone 1 that are not plural nouns ("1 is", "1 plus", "1 times").
const NOT_PLURAL = new Set(['is', 'was', 'has', 'does', 'plus', 'minus', 'times', 'less', 'across', 'this', 'its', 'as', 'thus', 'us', 'yes', 'bus', 'gas', 'goes', 'makes', 'takes', 'equals', 'means', 'shows', 'gives', 'comes', 'stays', 'tells', 'needs', 'gets', 'lies', 'sits', 'moves', 'says', 'turns', 'falls', 'rises', 'grows', 'cross', 'focus', 'bonus', 'versus', 'chorus', 'circus', 'status', 'process', 'access', 'success', 'actress', 'address', 'leaves', 'appears', 'solves', 'remains']);

// The spoken first sound of a number decides a or an: an 8, an 11, an 18, an 80, an 800 (pass IB).
function articleFor(numberText) {
  const n = numberText.replace(/,/g, '');
  if (/^8/.test(n)) return 'an';
  if (/^1[18]$/.test(n) || /^1[18]\d{3}$/.test(n) || /^1[18]\d{6}$/.test(n)) return 'an';
  return 'a';
}

// Every slip the checks can see in one question, as short names; an empty list means nothing mechanical was found.
export function wordingFlags(q) {
  const flags = [];
  const prompt = String(q.prompt || '');
  const lastSentence = prompt.split(/(?<=[.?!])\s+(?=[A-Z0-9"'(])/).pop().trim();
  const lastWords = lastSentence.replace(/[?.!,;:]/g, ' ').trim().split(/\s+/).filter(Boolean);
  const wholeAsk = lastWords.length >= 3 && /\b(what|how|where|whom|why)\?$/i.test(lastSentence);
  if (q.type !== 'writing' && q.type !== 'trace' && /\?$/.test(lastSentence) && !/=/.test(prompt) && !wholeAsk && lastWords.length <= 4 && !VERBS.test(lastSentence) && !/^(who|what|which|where|when|why|how)\b/i.test(lastSentence)) flags.push('fragment');
  if (q.type !== 'writing' && /\b(is|are)\?$/.test(lastSentence) && !/^(who|what|which|where|when|why|how|is|are|do|does|can)\b/i.test(lastSentence)) flags.push('trailing');
  if (q.type !== 'writing' && TRAILING.test(prompt) && !/\bthe word \w+\?$/.test(prompt)) flags.push('trailing');
  if (q.type !== 'writing' && q.type !== 'trace' && !/[?]/.test(prompt) && !/=/.test(prompt) && !/\.\.\.$/.test(prompt.trim()) && !IMPERATIVE.test(prompt.trim()) && !IMPERATIVE.test(lastSentence)) flags.push('no-question');
  if (q.story && !/\bthe word that\b/i.test(prompt) && /\bthat\b(?! (is|was|are|were|has|have|had|can|could|will|would|makes|made|means|shows|show|helps|uses|lets|keeps|says|tells|people|you|they|we|it)\b)/i.test(prompt) && !/\bthat\b/i.test(prompt.replace(/\b(so|such|now|and|but) that\b/gi, ''))) flags.push('that-with-setup');
  if (q.story && !/\bthe word that\?$/i.test(prompt) && /^(what|which|how|why|who|where|when|is|are|does|do|can)\b[^.]*\bthat\?$/i.test(prompt)) flags.push('that-with-setup');
  const explain = String(q.explain || '').trim();
  if (/^(which|who|whose|what|how|why)\b[^.]*: /i.test(explain)) flags.push('explanation-fragment'); // a label (Who leads a city: the mayor.), not a sentence
  if (q.type !== 'writing' && q.type !== 'trace' && (!explain || explain.toLowerCase() === String(q.answer).toLowerCase())) flags.push('no-explanation');
  const allText = [q.story, prompt, explain].filter(Boolean).join(' ');
  // A name written in lower case (the alamo, the mexican president, the rio grande), usually from a template that lower-cased a
  // whole phrase to fit it after a colon (pass IE).
  const lowName = allText.match(/\b(alamo|liberty bell|statue of liberty|rio grande|mexican|mexico|texan|texans|texas|industrial revolution|united states|american|britain|british|england|spanish|spain|french|france|europe|european|africa|african|asian|juneteenth|san jacinto|sam houston|stephen f|moses austin|washington|lincoln|jefferson|germany|hitler|martin luther|americans|brown v|rome|lyndon|roosevelt|kennedy|congress passes|january|february|march 1|april|june|july|august|september|october|november|december|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  if (lowName) flags.push(`lower-case-name-${lowName[1].replace(/ /g, '-')}`);
  for (const m of allText.matchAll(/(?:^|[^\d.,/-])1 ([a-z]+s)\b/g)) if (!NOT_PLURAL.has(m[1]) && !/ss$/.test(m[1])) { flags.push(`one-${m[1]}`); break; }
  for (const m of allText.matchAll(/\b(a|an) (\d[\d,]*)\b/gi)) if (m[1].toLowerCase() !== articleFor(m[2])) { flags.push(`article-${m[1]}-${m[2]}`); break; }
  // A or an by sound (pass IC): a owl, an cat. Words that start with a vowel letter but a consonant sound (a one, a unit,
  // a European) and the silent-h words (an hour, an honest) are left alone.
  const aVowel = allText.match(/(?<!([Ss]mall|[Bb]ig|[Ll]etter|[Cc]apital|[Ll]owercase) )\ba ([aeiou][a-z]*)/); // small a and big A are letters, not articles
  if (aVowel && !/^(one|once|uni|use|usu|uti|ure|uro|eu|ewe|uk)/.test(aVowel[2])) flags.push(`article-a-${aVowel[2]}`);
  // A sentence that opens with A before a vowel word (A ice) is the same slip; A and B, A is, and other letter talk are not.
  const capA = allText.match(/(?:^|[.?!] )A ([aeiou][a-z]+)/);
  if (capA && !/^(and|is|are|or|as|at|in|on|of|if|it|an|always|also|only|often|again|even|ever|usually|alone|above|after)\b|^(one|once|uni|use|usu|eu)/.test(capA[1])) flags.push(`article-A-${capA[1]}`);
  const anConsonant = allText.match(/\b[Aa]n ([b-df-hj-np-tv-z][a-z]*)/);
  if (anConsonant && !/^(hour|honest|honor|heir|herb)/.test(anConsonant[1])) flags.push(`article-an-${anConsonant[1]}`);
  if (/^[a-z]/.test(explain) && !/^[a-z](\s|$|[=+\-*/^(<>.,_])/.test(explain) && !/^(pH|mL|km|cm|mm|kg|mg|kW|e\.g|i\.e|log|ln|sin|cos|tan)\b/.test(explain)) flags.push('lowercase-start');
  const doubled = allText.match(/\b([a-z]{2,}) \1\b/i);
  if (doubled && !/^(that|had|hop|clap|tap|stomp|knock|beep|boo|bye|no|yes|ha|so|very|far|again|round|bang|buzz|na|quack|moo|woof|tick|tock|ding|dong|pop|drip|drop|chop|zig|zag|tweet|honk|choo|ho|la|go|run|jump|step|is)$/i.test(doubled[1])) flags.push(`doubled-${doubled[1].toLowerCase()}`);
  if (q.type === 'choice') {
    const choices = q.choices || [];
    if (choices.filter((c) => c === q.answer).length !== 1) flags.push('answer-not-once');
    if (new Set(choices).size !== choices.length) flags.push('choices-repeat');
    if (choices.length < 2) flags.push('too-few-choices');
  }
  return flags;
}

// The words a choice shows: picture choices (dots:4, shape:circle) are named the way the screen reads them aloud.
function words(choice) {
  if (typeof choice !== 'string') return String(choice);
  return /^[a-z]+:/.test(choice) && typeof describeChoice === 'function' ? `[${describeChoice(choice)}]` : choice;
}

// Every distinct question a bank can make, sampled the way the pool audit samples, with the number of versions of each
// pattern (numbers folded together) so a computed bank shows a few examples rather than hundreds.
export function bankQuestions(generator, samples = 300) { // samples: how many versions of the bank to read
  const patterns = new Map();
  for (let s = 1; s <= samples; s++) {
    const q = generateQuestion(generator, s * 7919);
    const key = [q.story || '', q.prompt, q.answer].join(' | ').replace(/\d+(\.\d+)?/g, '#');
    if (!patterns.has(key)) patterns.set(key, { q, versions: 0, flags: new Set() });
    const row = patterns.get(key); row.versions++;
    for (const f of wordingFlags(q)) row.flags.add(f);
  }
  return [...patterns.values()];
}

// The modules to review, course by course in the app's own order, optionally one grade or one course.
function modulesFor({ grade = null, course = null } = {}) {
  const rows = [];
  for (const c of COURSES) {
    if (grade && String(c.grade) !== String(grade)) continue;
    if (course && c.id !== course) continue;
    for (const m of c.modules) rows.push({ course: c, module: m });
  }
  return rows;
}

// One question as a line of the sheet, in screen order: question, setup, answer, other choices, explanation.
function questionLine(q, versions, flags) {
  const others = q.type === 'choice' ? (q.choices || []).filter((c) => c !== q.answer).map(words).join(' / ') : '';
  const parts = [`Q: ${q.prompt}`];
  parts.push(`A: ${words(q.answer)}`);
  if (others) parts.push(`X: ${others}`);
  if (q.explain) parts.push(`E: ${q.explain}`);
  const tail = [versions > 1 ? `${versions} versions` : '', flags.size ? `FLAG ${[...flags].join(', ')}` : ''].filter(Boolean).join('; ');
  return `- ${parts.join(' | ')}${tail ? `  (${tail})` : ''}`;
}

// A whole review sheet: each module, each bank, each setup line once with the questions that use it.
export function reviewSheet(filter, { perComputedBank = 6 } = {}) {
  const out = [];
  const done = new Set();
  for (const { course, module } of modulesFor(filter)) {
    out.push(`\n### ${course.grade} ${course.subject}: ${module.title} (${module.id})`);
    for (const g of new Set(module.generators)) {
      if (done.has(g)) { out.push(`(bank ${g} is listed above)`); continue; }
      done.add(g);
      const rows = bankQuestions(g);
      const computed = rows.length > 24;
      const shown = computed ? rows.filter((r, i) => r.flags.size || i < perComputedBank) : rows;
      out.push(`bank ${g}: ${rows.length} patterns${computed ? `, ${shown.length} shown` : ''}`);
      let lastStory = null;
      for (const r of shown) {
        const story = r.q.story || '';
        if (story && story !== lastStory) out.push(`  S: ${story.replace(/\n+/g, ' / ')}`);
        lastStory = story || lastStory;
        out.push(questionLine(r.q, r.versions, r.flags));
      }
    }
  }
  return out.join('\n');
}

// Every flagged question in the app, bank by bank.
export function flaggedQuestions(samples = 300) {
  const rows = []; const done = new Set();
  for (const { course, module } of modulesFor()) for (const g of new Set(module.generators)) {
    if (done.has(g)) continue; done.add(g);
    for (const r of bankQuestions(g, samples)) if (r.flags.size) rows.push({ grade: course.grade, module: module.id, generator: g, q: r.q, flags: [...r.flags] });
  }
  return rows;
}

if (process.argv[1] && process.argv[1].endsWith('question-review.mjs')) {
  const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
  if (process.argv.includes('--flags')) {
    const rows = flaggedQuestions();
    console.log(`# Flagged questions\n\n${rows.length} question patterns carry a wording flag.\n`);
    for (const r of rows) console.log(`- ${r.grade} ${r.generator} [${r.flags.join(', ')}] Q: ${r.q.prompt}${r.q.story ? ` | S: ${String(r.q.story).replace(/\n+/g, ' / ').slice(0, 120)}` : ''} | A: ${r.q.answer} | E: ${r.q.explain || ''}`);
  } else {
    console.log(`# Question review sheet${arg('--grade') ? `, grade ${arg('--grade')}` : ''}${arg('--course') ? `, ${arg('--course')}` : ''}\n\nEach line is one question as the practice screen shows it: Q the question, S the setup line under it, A the answer, X the other choices, E the explanation after answering.`);
    console.log(reviewSheet({ grade: arg('--grade'), course: arg('--course') }));
  }
}
