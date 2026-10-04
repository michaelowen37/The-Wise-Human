// The Wise Human. Copyright (c) 2026. Source-available; not for reuse. See LICENSE.md.
// Which block of docs/WHATS-NEW.md educators see in the What's new pop-up (2026-09-28, pass FR). The build and its
// test both ask here, so the page and the check can never disagree.
//
// A block starts with a heading like "## September 28, 2026 (stories that flow)". The newest is the one with the
// latest date; when two share a date, the one higher in the file wins, which is why every pass adds its block at the
// top. The stamp educators are remembered against is the whole heading, so a second block on the same day still shows.
// Before this pass the build read the heading as one word ("2026-09-22"), so once the headings became dates with
// spaces (September 24) nothing matched and the pop-up went dark for every build since.
// parseNews reads every block of docs/WHATS-NEW.md into { stamp, date, title, items, when, order }, newest first: the
// latest date wins, and on the same date the block higher in the file wins.
function parseNews(doc) {
  const blocks = String(doc || '').split(/\n(?=## )/).filter((b) => b.startsWith('## '));
  const parsed = blocks.map((b, order) => {
    const lines = b.split('\n'); const heading = lines[0].slice(3).trim();
    const dateText = heading.replace(/\s*\(.*$/, '').trim(); const when = new Date(dateText).getTime();
    const titleMatch = heading.match(/\(([^)]*)\)/);
    const items = lines.slice(1).filter((ln) => ln.startsWith('- ')).map((ln) => ln.slice(2).trim());
    return { stamp: heading, date: dateText, title: titleMatch ? titleMatch[1] : '', items, when: Number.isNaN(when) ? -Infinity : when, order };
  }).filter((b) => b.items.length);
  parsed.sort((a, b) => (b.when - a.when) || (a.order - b.order));
  return parsed;
}
// briefNews (2026-10-01, pass HL, Mikey): the pop-up shows each change in a few natural words, and the More Details page
// shows it whole. In plain terms: a note is cut at its first colon, or at the end of its first sentence (a period,
// question mark or exclamation point followed by a space and a capital letter), so "a new kind of game for small hands:
// water, sunshine..." becomes "a new kind of game for small hands." A price like $4.95 or "U.S. economy" is never cut,
// because neither has a space and a capital after its period. A note that is already one sentence is left whole.
export function briefNews(item) {
  const t = String(item || '').trim();
  const m = t.match(/^([\s\S]*?)(?::\s|[.!?](?=\s+[A-Z])|$)/);
  const cut = ((m && m[1]) || t).trim();
  return /[.!?]$/.test(cut) ? cut : `${cut}.`;
}
// newestNews: the block educators see in the pop-up, with a short version of each note for the pop-up itself.
export function newestNews(doc) {
  const parsed = parseNews(doc);
  if (!parsed.length) return null;
  const { stamp, date, items } = parsed[0];
  return { stamp, date, items, brief: items.map(briefNews) };
}
// recentNews: the last few blocks in full, newest first, for the More Details page.
export function recentNews(doc, n = 6) {
  return parseNews(doc).slice(0, n).map(({ date, title, items }) => ({ date, title, items }));
}
