---
name: add-course
description: Add a new course (a subject with ordered modules) to EduSphere. Use for a new subject or grade band.
---
# Add a course

1. In `src/logic.mjs`, add an entry to `COURSES`:
```js
{
  id: 'reading-k',          // letters, numbers, dashes
  subject: 'Reading',       // Math, Reading, Science, ...
  title: 'Letters and sounds',
  audience: 'Kindergarten',
  readAloud: true,          // true for pre-readers: questions are spoken, answers tapped
  modules: READING_K_MODULES(),
},
```
2. Add a function `READING_K_MODULES()` returning an ordered list of modules. Each module needs: `id`, `order` (1, 2, 3…), `title`, `tagline`, `lesson` (`paragraphs`, `keyIdea`, `example`), `sources` (plain text standard codes; TEKS for Texas), and `generators` with AT LEAST 5 ids (rule 6).
3. Lesson `example` is a picture: `{ parts, shaded, caption }` draws a bar; `{ kind: 'dots', count, caption }` draws dots. A new picture kind needs a drawing function in `ui.jsx` (`Picture`) and a test update in section 1 of the tests.
4. Add the generators (see the add-question-type skill). For read-aloud courses every generator must be `type: 'choice'`.
5. Run `./check.sh`. The tests check: the course exists, every module has 5+ generators, every generator is valid over 300 seeds, statuses unlock in order within the course.
6. Nothing else changes: unlocking, review questions, reports, and the educator course switches pick up the new course automatically.
