---
name: add-question-type
description: Add a new practice question type (generator) to EduSphere, with its independent test. Use whenever a module needs more variety.
---
# Add a question type

Every generator is a function `(rng) => question` that uses only the seeded
random helpers, so the same seed always makes the same question. Copy this
template into `GENERATORS` in `src/logic.mjs` (or into `makeCountingGenerators`
for the counting course) and fill in the blanks:

```js
'm2-example': (rng) => {
  const { n: a, d: b } = pickSimpleFraction(rng);   // or randInt(rng, min, max)
  const k = randInt(rng, 2, 4);
  const correct = frac(a * k, b * k);
  return {
    type: 'choice',                                  // or 'number' (learner types a whole number)
    story: null,                                     // one short setup line, or null
    prompt: `Which fraction equals ${a}/${b}?`,      // ONE sentence, under 70 characters
    choices: buildFractionChoices(rng, correct, [frac(a + k, b + k), frac(a, b * k)]),  // null for type 'number'
    answer: fracText(correct),                       // a string; for 'number', String(wholeNumber)
    explain: `Multiply top and bottom by ${k}.`,     // computed from the numbers, never typed as a fact
    visual: null,                                    // { parts, shaded } or { kind: 'dots', count } or null
    explainVisual: [{ parts: b, shaded: a, label: `${a}/${b}` }],  // labeled bars, or null
  };
},
```

Steps:
1. Add the generator with a new id (`m1-`, `m2-`, `m3-` for the fraction modules; `k5-`/`k10-` via the counting factory).
2. Add the id to the module's `generators` list.
3. Add an independent check in `tests/logic.test.mjs`, section 1, next to the others. It must recompute the answer from the question text or numbers WITHOUT using the generator's own answer, e.g.
   `if (genId === 'm2-example') { const [a, b] = nums[0].split('/').map(Number); if (!L.fracEqual(L.frac(a, b), parse(q.answer))) problems.push('example: answer not equivalent'); }`
4. Run `./check.sh`. The 300-seed loop will now cover the new type. It must end with `ALL CHECKS PASSED`.
5. Rules to keep: choices contain the answer exactly once; no two choices are the same amount; prompt is one sentence; nothing in `explain` is a fact you typed — it is built from the numbers.
