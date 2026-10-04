// Game layout audit (2026-10-02, pass IM; Mikey: no tiles leaving the screen and no words leaving tiles, on every screen
// size). Opens every game on five screens, from a small phone to a laptop and a phone held sideways, and records: the
// page scrolling sideways, the board wider or taller than the screen, any piece of the board drawn outside it, and any
// words spilling out of the tile that holds them. Writes tests/e2e/out/game-layout.json and prints one line per problem.
// Run: node tests/e2e/game-layout.mjs   (after check.sh has built tests/e2e/page.html)
import { createRequire } from 'node:module'; import { pathToFileURL } from 'node:url'; import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const L = await import(new URL('../../src/logic.mjs', import.meta.url).href);
const SIZES = [[320, 568, 'small phone'], [390, 844, 'phone'], [844, 390, 'phone sideways'], [768, 1024, 'tablet'], [1280, 800, 'laptop']];
const only = process.argv[2] ? new Set(process.argv[2].split(',')) : null;
const games = L.GAMES.filter((g) => !only || only.has(g.id));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', hasTouch: true });
await page.goto(pathToFileURL(new URL('./page.html', import.meta.url).pathname).href);
await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'welcome');
await page.getByRole('button', { name: 'Create account' }).click(); await page.waitForTimeout(300);
await page.fill('input[placeholder="PIN"]', '2468'); await page.fill('input[placeholder="PIN again"]', '2468');
await page.fill('input[placeholder="This device\'s name"]', 'G'); await page.selectOption('select[aria-label="Your state"]', 'TX');
await page.getByRole('button', { name: 'Create account', exact: true }).click();
await page.waitForFunction(() => window.__eduTest.screen === 'educator-pick'); await page.waitForTimeout(500);
for (const name of ['Skip tour', 'Later', 'Got it']) { const b = page.getByRole('button', { name }); if (await b.count()) { await b.first().click({ force: true }); await page.waitForTimeout(150); } }
await page.getByLabel(/Walk through early years/i).first().click({ force: true });
await page.waitForFunction(() => window.__eduTest.screen === 'overview');
const report = []; let problems = 0; let notes = 0;
const MUST_FIT = ['pong', 'ship', 'catch', 'jump', 'path', 'maze', 'dots', 'jigsaw', 'sort', 'buckets', 'balance', 'map', 'pairs'];
// Words on text cards (--words): every word of every matching-pairs deck must fit across its card without breaking,
// on a small phone and a phone, at the size the card draws it.
if (process.argv.includes('--words')) {
  for (const [w, h, label] of SIZES.slice(0, 2)) {
    await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(200);
    for (const g of L.GAMES.filter((x) => x.kind === 'pairs' && x.deck)) {
      await page.evaluate((id) => window.__eduTest.openColoring('play:' + id), g.id); await page.waitForTimeout(350);
      const texts = L.PAIR_DECKS[g.deck].flat();
      const bad = await page.evaluate((texts) => {
        const card = document.querySelector('.edu-game-box button'); if (!card) return ['no card'];
        const cs = getComputedStyle(card); const inner = card.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 4;
        // A copy of a turned card, with the card's own text rules (a long word breaks at a syllable, never past the edge).
        const probe = card.cloneNode(false); probe.style.visibility = 'hidden'; probe.style.position = 'absolute'; probe.style.width = card.offsetWidth + 'px'; card.parentNode.appendChild(probe);
        const out = [];
        for (const t of texts) { const longest = Math.max(...String(t).split(/\s+/).map((x) => x.length)); probe.innerHTML = ''; const s = document.createElement('span'); s.lang = 'en'; s.textContent = t; s.style.cssText = `font-family:${cs.fontFamily};font-size:${longest > 9 ? 12 : t.length > 10 ? 13 : 16}px;font-weight:700;padding:2px;text-align:center;line-height:1.2;overflow-wrap:anywhere;hyphens:auto;min-width:0;max-width:100%`; probe.appendChild(s); if (probe.scrollWidth > probe.clientWidth + 1 || s.scrollWidth > s.clientWidth + 1) out.push(`${t} (${probe.scrollWidth} in ${probe.clientWidth})`); }
        probe.remove(); return [...new Set(out)];
      }, texts);
      for (const b of bad) { problems++; console.log(`${label} ${w}x${h} | ${g.id} | words leave the card: ${b}`); }
    }
  }
  console.log(`words checked: ${problems} problems`); await browser.close(); process.exit(0);
}
for (const [w, h, label] of SIZES) {
  await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(200);
  for (const g of games) {
    await page.evaluate((id) => window.__eduTest.openColoring('play:' + id), g.id);
    await page.waitForTimeout(450);
    const found = await page.evaluate(() => {
      const vw = window.innerWidth, vh = window.innerHeight; const issues = [];
      const box = document.querySelector('.edu-game-box');
      if (!box) return { issues: ['no game board on the screen'] };
      const br = box.getBoundingClientRect();
      if (document.documentElement.scrollWidth > vw + 1) issues.push(`the page scrolls sideways (${document.documentElement.scrollWidth} wide on a ${vw} screen)`);
      if (br.left < -1 || br.right > vw + 1) issues.push(`the board runs off the screen (${Math.round(br.left)} to ${Math.round(br.right)} on ${vw})`);
      if (br.height > vh + 1) issues.push(`the board is taller than the screen (${Math.round(br.height)} on ${vh})`);
      for (const el of box.querySelectorAll('*')) {
        const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
        const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
        if (el.closest('.edu-cheer')) continue;
        const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 34);
        if (r.left < br.left - 2 || r.right > br.right + 2 || r.top < br.top - 2 || r.bottom > br.bottom + 2) {
          if (!(el instanceof SVGElement) || el.tagName.toLowerCase() === 'svg') issues.push(`a piece sits outside the board: <${el.tagName.toLowerCase()}> "${text}"`);
        }
        const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (ownText && !(el instanceof SVGElement) && el.clientWidth > 0 && (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2)) issues.push(`words spill out of their tile: "${text}" (${el.scrollWidth}x${el.scrollHeight} in ${el.clientWidth}x${el.clientHeight})`);
      }
      return { issues: [...new Set(issues)].slice(0, 10), board: [Math.round(br.width), Math.round(br.height)] };
    });
    report.push({ size: label, w, h, id: g.id, kind: g.kind, title: g.title, ...found });
    // A tap-and-scroll game (a list of choices, steps or sentences) may be taller than a phone held sideways, because the
    // page scrolls and nothing has to be seen at once. A board you play in motion or by dragging must fit the screen.
    for (const i of found.issues) { if (/taller than the screen/.test(i) && !MUST_FIT.includes(g.kind)) { notes++; continue; } problems++; console.log(`${label} ${w}x${h} | ${g.id} (${g.kind}) | ${i}`); }
  }
}
fs.mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('./out/game-layout.json', import.meta.url), JSON.stringify(report, null, 1));
console.log(`${games.length} games on ${SIZES.length} screens: ${problems} problems (${notes} tap-and-scroll games taller than a sideways phone, which scroll)`);
await browser.close();
