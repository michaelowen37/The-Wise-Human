# The writing review

Written 2026-10-03 (pass JE) from Mikey's review of the newest lessons on his Mac. Mikey first planned for Fable 5.1 to do the rewrite. After the Opus sample in pass JF he asked Opus to carry on ("You can continue editing each lesson, story, title, question etc."), starting with pre-K and working up (pass JG). The file keeps its name so older notes still point here; it says plainly what he wants, whichever model does the work. Read it with docs/NEW-CHAT.md before the first rewrite. The work list, in order, is docs/REVIEW-LEDGER.md.

## What Mikey said, in his words

- "It reads robotically and has grammatical issues."
- "It reads as if it is just a bulleted list of facts rather than flowing nicely, looking at information from various perspectives and truly focusing on getting an idea across. Sounds more like it's attempting to check a box that the fact was presented."
- "I don't care if long explanatory text increases length, the ability to truly learn the information is priority. Not shooting for memorization."
- "Maybe lessons can read like stories and be more explanatory with greater context. We want thorough understanding not merely mapping to and crossing off of standards."
- "The stories are written a little better but are just kind of off a little. Maybe make them sound even more natural. The varying sentence length is good but the constant use of colons, odd starting points and assumptions."
- "We can cut back a lot on colons in our writing and cut back a little with semi colons too."
- "Maybe an example or short explanation can be added to some of these questions for context? Only the early learners need shorter questions but even those should prioritize context and flow over character limits."

## Why the old writing came out this way

The house rules and the pace produced it. Teaching text was written one idea per line. A test requires every quiz answer to appear in the lesson, which rewarded naming terms over explaining them. Prompts were capped at 70 characters. Each pass shipped a whole course in one turn, and no check measured whether a lesson reads well. Pass JE lifted the prompt cap and rewrote the house rule. Keep the good parts of the old rules (every answer is taught before it is asked, key ideas stay at 28 words a sentence) and drop the habits.

## What good looks like

### Lessons, grade 3 and up

- Explain the idea as a system. Say what it is, why it exists, how its parts connect, where it shows up in a reader's life, and what goes wrong without it, in the order a curious person would ask.
- Write connected paragraphs, the way a good teacher talks, never a stack of one-line facts. Length is welcome when it buys understanding.
- Show the idea from more than one side. Give a worked example with real context, an everyday comparison, and the view of someone who would see it differently.
- Define a word in the sentence where it first matters, then use it again so it sticks.
- Every answer in the module's question bank is still taught in the lesson (tools/untaught.mjs), but taught by explaining it, never by listing it.
- Colons rarely, semicolons sparingly. A colon joining two thoughts is usually two sentences, or one sentence with "because".

### Early years, pre-K to grade 2

Short, spoken, and shown rather than told, as now, but natural. Context and flow come before length.

### Questions

- Ask in natural, complete sentences, the way a teacher would say them aloud. Write answers the way a person would say them.
- Give context when a question needs it, with a short example or the bank entry's setup line (returned as `story`). There is no character limit now. A 400-character guard only catches a pasted paragraph.
- Never trade accuracy for flow. Mikey's own example shows the trap. "As prices rise, what happens to demand? It falls." mixes up the exact idea the course teaches. A rising price lowers the quantity demanded, a move along the curve. A fall in demand means the whole curve shifted because something else changed, like income or tastes. A version that flows and stays right is "When the price of something rises, what usually happens to the amount people want to buy? It falls." In the same way, "Which word best describes when supply equals demand?" reads well but blurs the idea, so ask "What do economists call the price where the amount buyers want matches the amount sellers offer?"
- Mikey's other examples, to fix first: the production possibilities frontier question about the frontier moving outward (it needs a picture in words of what moved and why), "Comparing the benefit and cost of one more unit" (too blunt; give a small example, such as deciding whether to bake one more batch of cookies), "Where quantity supplied equals quantity demanded is called what" (sounds machine-made), and the lesson line "A cold snap raises demand for heaters while a new factory raises their supply: the quantity sold rises for sure, and the price depends on which shift is bigger." (explain each shift in its own sentence, then what the two do together).

### Stories

- A natural voice, varied sentence lengths and few colons. Open where a reader can follow, not on an odd detail.
- Never assume the reader knows something. "Adam Smith opened the Wealth of Nations" never says it is a book, Smith's 1776 book about what makes nations rich, and a line about "the day the transmission goes" assumes a car-repair idiom. Say what a thing is the first time it appears, and let the story grow when that is what it takes. The pin factory deserves the room.
- Keep the Miniature Gladwell arc, the cast rules and the true-story checks (every fact verified by web). Keep every picture beside the paragraph it shows (the art audit); a rewritten paragraph may need its picture's caption and prompt updated in docs/ART-REQUESTS.md.

## Sentence length

Mikey checked ElevenLabs' Eleven v4 page (his screenshots, 2026-10-03). It sets no sentence-length limit, takes up to 10,000 characters in one generation and stitches longer pieces together, and uses inline tags such as [pause], [long pause], [whispers], [excited] and [sighs] where older models used SSML breaks. So audio never shortens a sentence. Write each sentence as long as its thought needs. The only reader whose sentence length still matters is a pre-reader listening, and even there flow and clarity come first. The tests keep a 45-word run-on guard for stories and explanations (it was 32), the eighteen-word read-aloud rule for early-years stories, and 28 words for each sentence of a key idea.

## Audio tags

When a story is read, write its audio tags in the same pass (Mikey, pass JH). A story's `audio` field in src/stories.mjs is its words with Eleven v4 tags in square brackets and nothing else changed, and readers never see it. Use sound effects sparingly, one to three a story, where the story already names the sound (a splash, a moo, footsteps in snow). Use feeling and delivery tags where a line turns ([puzzled], [whispers], [sighs], [delighted]), and end an early-years story's closing lesson line with [slowly, warmly]. Questions are spoken warm, pleasant and mildly upbeat, never over-excited. Young learners hear words drawn out and stressed the way a favorite preschool teacher says them; older learners hear a warm, engaging voice that never talks down. Then run node tools/audio-ledger.mjs > docs/AUDIO-LEDGER.md. Mikey also welcomes more paintings wherever a picture would teach a lesson better; log each one in docs/ART-REQUESTS.md (the lesson screen will need a painting slot the first time one is used).

## How to work

1. One small batch a pass. Three or four modules (lesson, story and questions together), more for the early years. Slow is the point.
2. For each module, read the lesson, the story and the bank, then rewrite them together. Check every fact by web, with the newest research and older findings kept as history with their date. Read every sentence aloud.
3. Keep the standards citations exactly as they are unless one is wrong. Keep the bank at least as large as it is, since questions are never reduced, and keep every answer taught.
4. Mark each item in docs/review-status.json with the pass name, then run node tools/review-ledger.mjs > docs/REVIEW-LEDGER.md. The ledger's colon counts show the change.
5. Deliver the pass the usual way (docs/NEW-CHAT.md and CLAUDE.md), and say in the DECISIONS entry what changed in each module.
6. Mikey approved the voice after the JF sample. Keep showing him each batch, and change course when he says so.
7. New courses after the review (PHIL 1301 and the rest) are written this way from the start.
8. Read docs/PICTURE-CANDIDATES.md (node tools/picture-candidates.mjs) for the modules in the batch, and give each comparison its picture where seeing the real thing teaches more than the words.

## Learned in pass JF, from the first rewritten module

- The screen used to break every lesson paragraph into one sentence per line (formatTeachingText), which is a large part of why lessons read like checklists. Set `prose: true` on every rewritten lesson so its paragraphs stay whole, and put each key term in bold (**term**) where it is defined.
- Scarcity, trade and markets (college macroeconomics: the lesson, the story S3596 and the bank macro-markets) is the first rewrite and the reference for the new style. Read it before writing, and change it too if Mikey asks.
- A question that needs a situation gets a setup line, the bank entry's fifth item, and its prompt names the setup with "this". The untaught check reads answers of three words or fewer, so those words must appear in the lesson's paragraphs or key idea (for example "it falls" and "it moves outward").
- A short story may run to 350 words. If one truly needs more room, ask Mikey before raising STORY_WORD_LIMIT.

## The tour

Never change the words on the tour cards (Mikey, pass JI). The pages behind them come from the live lessons and titles, so look at them when a rewrite touches what they show, such as the fraction lesson behind card 2 or the sample students' modules.

## Order

Mikey's order (pass JG): pre-K first, then kindergarten, grades 1 to 12 and college, course by course, core courses before electives. docs/REVIEW-LEDGER.md lists every module in that order, then the long stories, the games and the Wonder questions. The three other modules Mikey named in his first review (Saving, investing and risk; The communication process; Communication and audience) come up in their grades.

## The full standard (pass JO, Mikey: more than grammar, accuracy, colons and audio)

Mikey asked whether the review covers writing style, explanatory quality and context in the lessons, titles, questions, answers and stories, and pictures that add value. Passes JG to JN did not, fully: they were a first pass, fixing facts, punctuation and story flow and writing audio tags, with some explanation fixes, but they did not rewrite lessons for teaching quality or add lesson pictures (the app had no lesson picture slot until pass JO). Those items are marked "firstPass" in docs/review-status.json, and the full standard goes back over them, starting again at pre-K. An item counts as reviewed only when all nine of these are done.

1. Accuracy. Every fact checked against a source; nothing a learner will have to unlearn later; the numbers inside a story add up.
2. Teaching quality. The lesson says why, not only what, and connects its ideas into one system (what causes what, how the pieces fit). It gives one clear example a learner can picture, at the right level for the grade, and teaches everything its questions ask.
3. Writing style. Natural sentences that flow, as in the Scarcity sample (pass JF): no colons or semicolons, warm plain words, no robotic runs, and the read-aloud limits for the early years.
4. Titles. Clear, accurate and inviting, shown in title case.
5. Questions. Each reads as a natural sentence, with a setup line wherever the question needs a situation; distractors are mistakes a learner could really make; the answer is taught in the lesson.
6. Explanations. Each says the answer and the reason in whole sentences, so it makes sense read aloud or seen after a wrong answer, never a fragment that only continues the answer ("And in good shape."). A rule now checks this for pre-K to grade 1.
7. Stories. A real problem, a turn and a resolution; the lesson's facts and no others; one tense; smooth read aloud.
8. Pictures. A lesson picture (P serial) wherever seeing the real thing teaches more than words, such as landmarks, plant parts, instruments and the moon's shapes; story picture prompts match the story; every prompt follows Mikey's template, and a real place is checked against a photo.
9. Audio. Eleven v4 tags in every story.

## Learned in pass JP, the first full-standard batch (pre-K 3)

- For a pre-reader the spoken script is the lesson. The read-aloud screen shows one line at a time with its picture, and the paragraphs and key idea never reach the child, so the review rewrites the script first and the paragraphs to match. Every word the questions use must be spoken in the script: More once asked for fewer and never said the word.
- Forty read-aloud lessons have no script. Since pass JP they speak every paragraph and then the caption, far better than the single caption they spoke before, but a lesson written for the ear is better still. Write each one a script when the review reaches it.
- A lesson picture in a read-aloud lesson names its spoken line (step) and shares a word with it.
- Anchor an early idea to something that is truly so (yellow like a banana, not like the sun), and never model something unsafe, even in passing.
- Explanations say the answer and the reason in the lesson's own words (This one is red, like a strawberry; The big circle takes up more room, so it is bigger).

## Learned in pass JV (kindergarten Letters)

- Write every sound a voice will say as the sound or by its anchor word (cuh; the sound at the start of apple). A voice reads a bare letter as its name, so "C, a, t" was heard as see, ay, tee, which never blends into cat. Check scripts, setups, explanations and stories for this, not only lessons about sounds.
- Describe a traced letter the way the app draws it (TRACE_LETTERS), and check the drawing too: six letters were drawn from the bottom while their lessons said down.
- When a lesson cannot show everything its questions ask without becoming too long for its learners, split the asking across lessons by family rather than lengthen the lesson, say so plainly, and record it. Each round's review question keeps earlier lessons in practice.

## Pictures beside comparisons (pass JV, Mikey)

Mikey's example: the pre-K 3 Triangles lesson says a slice of pizza is almost a triangle, and a slice beside the triangle shows it at a glance. Whenever a lesson compares an idea to a real thing (almost a triangle like a pizza slice, a cone like an ice cream cone, red like a strawberry), part 8 asks whether a picture of the real thing beside the idea would teach more than the words. For young learners it usually would. Do both halves: give the line a drawn pair now when the app can draw the thing (show a pair, the real thing and the idea, adding a drawing if one is missing), and log a P painting in docs/ART-REQUESTS.md with the real thing and the idea side by side. A painting replaces the drawn pair on that line once Mikey uploads it. docs/PICTURE-CANDIDATES.md lists every early-years lesson line that compares and has no picture yet; read its rows for each module in the batch, and widen the tool to older grades when the review reaches them.
