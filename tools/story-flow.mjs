// The story flow rules (2026-09-28, Mikey): what makes a paragraph read robotic. Shared by tools/story-flow-audit.mjs,
// which reports on every story, and tests/stories.test.mjs, which holds the early years at zero.
export const sentencesOf = (text) => text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+(?=[A-Z"'(])/).map((s) => s.trim()).filter(Boolean);
const wc = (s) => s.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
export function flowFlags(paragraph, { moral = false } = {}) {
  const sents = sentencesOf(paragraph); const lens = sents.map(wc); const flags = [];
  // A story's closing moral is a short refrain by design (Count one at a time. The last number is how many.), so the
  // choppy rule skips it; the other two rules still apply.
  // A single word on its own (Mmm. Corner. Peep!) is a sound, a shout or a beat, by design; it neither counts toward a choppy
  // run nor breaks one.
  let run = 0; if (!moral) for (const n of lens) { if (n === 1) continue; run = n <= 6 ? run + 1 : 0; if (run === 3) { flags.push('choppy'); break; } }
  for (let i = 0; i + 3 < lens.length; i++) { const w = lens.slice(i, i + 4); if (Math.max(...w) - Math.min(...w) <= 3 && Math.min(...w) >= 4) { flags.push('monotone'); break; } }
  for (let i = 1; i < sents.length; i++) if (/^Then\b/.test(sents[i]) && /^Then\b/.test(sents[i - 1])) { flags.push('then, then'); break; }
  return { flags, lens };
}
