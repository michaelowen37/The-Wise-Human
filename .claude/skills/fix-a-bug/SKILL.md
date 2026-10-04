---
name: fix-a-bug
description: Step-by-step way to fix a small bug in EduSphere without breaking a rule. Use for any "X looks wrong" or "Y crashes" report.
---
# Fix a bug (follow every step in order)

1. Write down the symptom in one line: which screen, what was tapped, what happened, what should have happened.
2. Decide which file owns it. Use this table:
   - Wrong answer marked right/wrong, wrong explanation, wrong unlock, wrong report number → `src/logic.mjs`
   - Something looks wrong, a button does nothing, text overlaps, a screen crashes → `src/ui.jsx`
   - Both → fix logic first, then the screen.
3. Run `node tests/logic.test.mjs`. If a line starts with `FAIL`, that line names the rule that is broken. Fix that rule first.
4. Find the code with grep, not by scrolling:
   - a screen: `grep -n "screen === 'NAME'" src/ui.jsx` (names: welcome, overview, lesson, practice, result, my-progress, educator-pin, educator-pick, educator-report)
   - a question type: `grep -n "'GENERATOR-ID'" src/logic.mjs` (e.g. `'m2-fill-top'`)
   - a rule: `grep -n "export function NAME" src/logic.mjs`
5. Change the smallest thing that fixes the symptom. Do not restructure, rename, or "clean up" nearby code.
6. If the bug was in a rule, add one test line in `tests/logic.test.mjs` that would have caught it: `ok('what must be true', <expression that is true when fixed>);`
7. Run `./check.sh`. It must end with `ALL CHECKS PASSED`. If not, read the failing line and go back to step 5.
8. Report in this order: symptom, file and line changed, which rule from CLAUDE.md it touches (or "none"), the last line of `./check.sh`.

## Errors you will see and what they mean
- `Rendered more hooks than during the previous render` → a `useEffect/useState/useMemo` sits below an early `return` in `ui.jsx`. Move it above the first `if (screen === ...) return`.
- `Unexpected token` or `TS1381` at a line in `dist/` → a JSX brace or tag is unbalanced near the last edit in `ui.jsx`. Count `{` and `}` and `(` and `)` on the lines you changed.
- `X is not defined` → a name used in `ui.jsx` does not match an exported name in `logic.mjs`. Run `grep -n "^export" src/logic.mjs` to see the real names.
- `Cannot find module 'react'` from tsc → ignore this one line only.
- A learner sees "This step could not be saved" → the host's storage failed; the session still works. Do not add retries or new storage calls; `storageSet` already retries once.
- A question shows `dots:3` as text → the screen must draw it: use `describeChoice()` for words or `DotGroup` for the picture.
