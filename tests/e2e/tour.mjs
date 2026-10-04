// The first week tour, card by card (2026-10-03, pass JE, Mikey: "We have them nearly perfect then they all go out of whack").
// In plain terms: walks all ten tour cards at tablet and laptop sizes and checks each card against Mikey's words for it (they
// sit beside TOUR in src/ui.jsx), so a change anywhere in the app that moves a card fails here instead of on his screen. It
// also checks that the backup reminder is never put on the page before the tour, that the classroom is at its top after the
// tour and after Later, that a lesson opens at its top with its title in title case, and that inside a frame as tall as the
// page (some previews work that way) the page around the frame is brought back to the top and card 9 sits on screen.
import { createRequire } from 'node:module'; import { pathToFileURL } from 'node:url'; import { writeFileSync } from 'node:fs';
import * as L from '../../src/logic.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
let passed = 0, failed = 0; const ok = (name, cond, info) => { if (cond) { passed++; console.log('PASS - ' + name); } else { failed++; console.log('FAIL - ' + name + (info ? '  ' + JSON.stringify(info) : '')); } };
const pageUrl = pathToFileURL(new URL('./page.html', import.meta.url).pathname).href;
const browser = await chromium.launch();
const overlap = (a, b) => !!(a && b) && Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0;
const near = (a, b, d) => Math.abs(a - b) <= d;
// Signs up a new educator and waits for card 1, watching the page for the backup reminder until the tour shows.
async function signUp(f) {
  await f.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'welcome');
  await f.getByRole('button', { name: 'Educator Login' }).click(); await f.waitForTimeout(300);
  await f.fill('input[placeholder="PIN"]', '2468'); await f.fill('input[placeholder="PIN again"]', '2468');
  await f.fill('input[placeholder="This device\'s name"]', 'G'); await f.selectOption('select[aria-label="Your state"]', 'TX');
  await f.evaluate(() => { window.__nudgeEarly = false; const mo = new MutationObserver(() => { const tour = document.querySelector('[aria-label="First week tour"]'); if (!tour && document.body.innerText.includes('Make your first backup soon')) window.__nudgeEarly = true; if (tour) mo.disconnect(); }); mo.observe(document.body, { childList: true, subtree: true, characterData: true }); });
  await f.getByRole('button', { name: 'Create account', exact: true }).click();
  await f.waitForFunction(() => window.__eduTest.screen === 'educator-pick');
  await f.waitForSelector('[aria-label="First week tour"]', { timeout: 5000 });
}
const measure = (f) => f.evaluate(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { left: Math.round(b.left), top: Math.round(b.top), right: Math.round(b.right), bottom: Math.round(b.bottom) }; };
  const q = (s) => r(document.querySelector(s));
  const sheet = document.querySelector('[aria-label="First week tour"]');
  return { screen: window.__eduTest.screen, y: Math.round(window.scrollY + ((document.getElementById('root') || {}).scrollTop || 0) + document.body.scrollTop), W: window.innerWidth, H: window.innerHeight, sheet: r(sheet), title: sheet ? (sheet.querySelectorAll('p')[1] || {}).textContent : '', life: q('[data-tour="life"]'), exp: q('[data-tour="experiments"]'), wonder: q('[data-tour="wonder"]'), reading: q('[data-tour="reading"]'), backup: q('[data-tour="backup"]'), search: q('input[aria-label="Search notes"]'), transcript: q('[data-tour="transcript"]') };
});
// Card by card at one size, then the classroom after the tour and after Later.
// box: the app scrolls inside a box of its own, as in the claude.ai panel that previews the .jsx file (pass JF), where scrolling
// the window does nothing.
async function walk(W, H, box = false) {   // box: false, 'root' (a box holds the app) or 'body' (the body scrolls)
  const tag = `${W}x${H}${box ? (box === 'body' ? ' with the body scrolling' : ' in a scrolling box') : ''}`;
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.goto(pageUrl);
  if (box === 'body') await page.addStyleTag({ content: 'html, body { height: 100% !important; }' });   // pass JG: the body scrolls, the window does not
  else if (box) await page.addStyleTag({ content: 'html, body { height: 100% !important; overflow: hidden !important; } #root { height: 100vh; overflow-y: auto; }' });
  await signUp(page);
  ok(`${tag}: the backup reminder waits for the tour`, !(await page.evaluate(() => window.__nudgeEarly)));
  for (let step = 1; step <= 10; step++) {
    await page.waitForTimeout(1250);
    const m = await measure(page); const s = m.sheet;
    let good = !!s && s.left >= -1 && s.top >= -1 && s.right <= m.W + 1 && s.bottom <= m.H + 1;
    const oneCol = m.life && m.exp ? Math.abs(m.life.top - m.exp.top) > 8 : true;
    if (step === 2) good = good && near(s.right, m.W, 14) && near(s.bottom, m.H, 14);
    // The page behind card 2 is the live fraction lesson (pass JI, Mikey): a rewrite of it, or of its title, shows in the tour by itself.
    if (step === 2) { const h1 = await page.evaluate(() => (document.querySelector('h1') || {}).textContent || ''); good = good && h1 === L.titleCase(L.getModule('fraction-meaning').title); }
    if (step === 3) good = good && m.backup.top - s.bottom >= -1 && m.backup.top - s.bottom <= 24 && overlap(s, m.life);
    if (step === 5) good = good && !overlap(s, m.life);
    if (step === 6) good = good && !overlap(s, m.reading) && (oneCol ? overlap(s, m.exp) && s.top - m.reading.bottom >= -1 && s.top - m.reading.bottom <= 24 : overlap(s, m.wonder) && s.right <= m.reading.left + 1);
    if (step === 7) good = good && overlap(s, m.life) && !overlap(s, m.exp) && (oneCol ? s.top - m.exp.bottom >= -1 && s.top - m.exp.bottom <= 24 : s.top <= m.life.top);
    if (step === 8) good = good && m.y === 0 && near(s.right, m.W, 14) && !!m.search && near(s.top, m.search.top, 6);
    if (step === 9) good = good && m.y === 0 && near(s.right, m.W, 14) && near(s.bottom, m.H, 14);
    if (step === 10) good = good && !!m.transcript && s.bottom <= m.transcript.top + 2;
    ok(`${tag}: card ${step} (${m.title}) sits where Mikey asked`, good, good ? null : m);
    await page.getByRole('button', { name: step < 10 ? 'Next' : 'Done' }).first().click();
  }
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => ({ screen: window.__eduTest.screen, y: Math.round(window.scrollY + ((document.getElementById('root') || {}).scrollTop || 0) + document.body.scrollTop), nudge: document.body.innerText.includes('Make your first backup soon') }));
  ok(`${tag}: after the tour the classroom is at its top, with the backup reminder`, after.screen === 'educator-pick' && after.y === 0 && after.nudge, after);
  await page.evaluate(() => { window.scrollTo(0, document.documentElement.scrollHeight); const r = document.getElementById('root'); if (r) r.scrollTop = r.scrollHeight; document.body.scrollTop = document.body.scrollHeight; }); await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Later' }).first().click(); await page.waitForTimeout(700);
  ok(`${tag}: Later leaves the classroom at its top`, (await page.evaluate(() => Math.round(window.scrollY + ((document.getElementById('root') || {}).scrollTop || 0) + document.body.scrollTop))) === 0);
  return page;
}
for (const [W, H, box] of process.env.FRAME_ONLY ? [] : [[760, 900], [820, 1180], [1024, 768], [1440, 900], [1280, 800], [860, 900, 'root'], [860, 900, 'body']].filter((s) => !process.env.ONLY_BODY || s[2] === 'body')) {
  const page = await walk(W, H, box || false);
  if (W !== 1280 && !box) { await page.close(); continue; }
  // A lesson opens at its top, title in title case (pass JE, Mikey: "upon opening, I am not at the top of the page").
  await page.getByRole('button', { name: 'High school and beyond' }).first().click(); await page.waitForTimeout(1200);
  const fold = page.locator('button[aria-expanded="false"]', { hasText: /Business/ }).first();
  if (await fold.count()) { await fold.click(); await page.waitForTimeout(800); }
  const card = page.locator('.edu-mod-card').last();
  await card.scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
  const before = await page.evaluate(() => Math.round(window.scrollY + ((document.getElementById('root') || {}).scrollTop || 0) + document.body.scrollTop));
  await card.locator('button:not([disabled])').first().click({ force: true }); await page.waitForTimeout(900);   // the Open button breathes, so it is never "stable"
  const opened = await page.evaluate(() => ({ screen: window.__eduTest.screen, y: Math.round(window.scrollY + ((document.getElementById('root') || {}).scrollTop || 0) + document.body.scrollTop), h1: (document.querySelector('h1') || {}).textContent || '' }));
  ok(`${box ? 'in a scrolling box, ' : ''}a lesson opened from far down the overview starts at its top`, before > 200 && opened.screen !== 'overview' && opened.y === 0, { before, ...opened });
  const words = opened.h1.split(/[\s-]+/).filter((w) => /^[A-Za-z]{4,}/.test(w));
  ok(`${box ? 'in a scrolling box, ' : ''}the lesson title shows in title case`, opened.screen !== 'lesson' || (words.length > 0 && words.every((w) => /^[A-Z]/.test(w))), opened);
  await page.close();
}
{ // A frame as tall as the whole page: the app's own window never scrolls there, so the page around the frame must.
  writeFileSync('/tmp/edu-frame-host.html', `<!doctype html><html><body style="margin:0;background:#111"><div style="height:120px;color:#ccc">Preview header</div><iframe id="app" src="${pageUrl}" style="border:0;width:100%;height:5000px;display:block"></iframe><div style="height:600px"></div></body></html>`);
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('file:///tmp/edu-frame-host.html'); await page.waitForTimeout(500);
  const f = page.frames().find((x) => x.url().endsWith('page.html'));
  await signUp(f);
  // Buttons in the frame are pressed in the page itself: whether a card is on screen is what the checks below measure.
  const press = (name) => f.evaluate((n) => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === n).click(), name);
  for (let step = 1; step <= 8; step++) {
    await page.waitForTimeout(1250);
    const oy = await page.evaluate(() => Math.round(window.scrollY)); const mm = await measure(f); const top = oy - 120; const bottom = top + 800;
    ok(`in a page-tall frame, card ${step} (${mm.title}) is on screen`, !!mm.sheet && mm.sheet.top >= top - 1 && mm.sheet.bottom <= bottom + 1, { oy, sheet: mm.sheet });
    await press('Next');
  }
  await page.waitForTimeout(1600);
  const outerY = await page.evaluate(() => Math.round(window.scrollY)); const m = await measure(f); const shownBottom = outerY - 120 + 800;
  ok('in a page-tall frame, card 9 brings the top of the page on screen and sits in the bottom right of what shows', outerY <= 122 && !!m.sheet && near(m.sheet.right, m.W, 14) && near(m.sheet.bottom, shownBottom, 16), { outerY, sheet: m.sheet, shownBottom });
  await press('Next'); await page.waitForTimeout(1300);
  await press('Done'); await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 1500)); await page.waitForTimeout(200);
  await press('Later'); await page.waitForTimeout(900);
  const y2 = await page.evaluate(() => Math.round(window.scrollY));
  ok('in a page-tall frame, Later brings the top of the classroom back on screen', y2 <= 122, { y2 });
  await page.close();
}
{ // A frame the host page cuts short (pass JG): the frame is taller than the panel that shows it, so its foot is hidden, the app
  // scrolls inside the frame, and the panel scrolls the frame. Every card must sit inside what shows, card 3 close above the link.
  writeFileSync('/tmp/edu-clip-host.html', `<!doctype html><html><body style="margin:0;background:#111"><div id="panel" style="height:700px;overflow:auto"><iframe src="${pageUrl}" style="border:0;width:100%;height:820px;display:block"></iframe></div></body></html>`);
  const page = await browser.newPage({ viewport: { width: 900, height: 800 } });
  await page.goto('file:///tmp/edu-clip-host.html'); await page.waitForTimeout(500);
  const f = page.frames().find((x) => x.url().endsWith('page.html'));
  await signUp(f);
  const press = (name) => f.evaluate((n) => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === n).click(), name);
  const panelTop = () => page.evaluate(() => Math.round(document.getElementById('panel').scrollTop));
  for (let step = 1; step <= 10; step++) {
    await page.waitForTimeout(1300);
    const pt = await panelTop(); const m = await measure(f); const top = pt; const bottom = Math.min(pt + 700, 820);
    let good = !!m.sheet && m.sheet.top >= top - 1 && m.sheet.bottom <= bottom + 1;
    if (step === 3) good = good && !!m.backup && m.backup.top >= top - 1 && m.backup.bottom <= bottom + 1 && m.backup.top - m.sheet.bottom >= -1 && m.backup.top - m.sheet.bottom <= 24;
    if (step === 8 || step === 9) good = good && pt === 0 && m.y === 0;
    ok(`in a frame cut short by its panel, card ${step} (${m.title}) shows whole${step === 3 ? ', close above the backup link' : ''}`, good, good ? null : { pt, sheet: m.sheet, backup: m.backup, y: m.y });
    await press(step < 10 ? 'Next' : 'Done');
  }
  await page.waitForTimeout(1200);
  await page.evaluate(() => { document.getElementById('panel').scrollTop = 120; }); await f.evaluate(() => window.scrollTo(0, 400)); await page.waitForTimeout(200);
  await press('Later'); await page.waitForTimeout(900);
  const after = { pt: await panelTop(), y: await f.evaluate(() => Math.round(window.scrollY + document.body.scrollTop)) };
  ok('in a frame cut short by its panel, Later shows the top of the classroom', after.pt === 0 && after.y === 0, after);
  await page.close();
}
await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
