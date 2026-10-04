// The Wise Human. Copyright (c) 2026. Source-available; not for reuse. See LICENSE.md.
// The dark theme check (2026-09-24, Mikey): start dark, as every new device now does, visit every screen the app can
// be on, and fail if any word on it reads at less than the contrast the web's accessibility rules ask for (4.5 to 1,
// or 3 to 1 for large words). Paper screens must stay light, and the choice must survive a reload.
// Run: node tests/e2e/make-page.mjs && node tests/e2e/dark-contrast.mjs
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
let pass = 0, fail = 0;
const ok = (label, cond, detail = '') => { console.log((cond ? 'PASS' : 'FAIL') + ' - ' + label + (cond || !detail ? '' : '  ' + detail)); cond ? pass++ : fail++; };
const src = readFileSync('src/ui.jsx', 'utf8');
const screens = [...new Set([...src.matchAll(/setScreen\('([a-z-]+)'\)/g)].map((m) => m[1]))].filter((s) => !['welcome', 'loading', 'result', 'quick-result', 'placement-result', 'checkpoint-result', 'writing-sent', 'wonder-voices', 'wonder', 'practice', 'educator-pin', 'educator-setup'].includes(s));
const studentScreens = new Set(['overview', 'lesson', 'story', 'coloring', 'course-story', 'my-progress']);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 360, height: 780 }, reducedMotion: 'reduce', hasTouch: true });
const url = pathToFileURL('tests/e2e/page.html').href;
await page.goto(url);
await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'welcome');
await page.getByRole('button', { name: 'Create account' }).click();
await page.fill('input[placeholder="PIN"]', '2468'); await page.fill('input[placeholder="PIN again"]', '2468');
await page.fill('input[placeholder="This device\'s name"]', 'Sweep'); await page.selectOption('select[aria-label="Your state"]', 'TX');
await page.getByRole('button', { name: 'Create account', exact: true }).click();
await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'educator-pick');
for (const name of ['Skip tour', 'Later', 'Got it']) { const b = page.getByRole('button', { name }); if (await b.count()) { await b.first().click({ force: true }); await page.waitForTimeout(150); } }
// One student, so the report and the certificate have someone to be about.
await page.getByRole('button', { name: 'Add someone new' }).click(); await page.fill('input[placeholder="School-issued ID"]', 'S-1'); await page.getByRole('button', { name: /^Elementary/ }).click(); await page.getByRole('button', { name: 'Add', exact: true }).click(); await page.waitForTimeout(250);
for (const name of ['Done', 'Not now', 'Skip', 'Later', 'Got it']) { const b = page.getByRole('button', { name }); if (await b.count()) { await b.first().click({ force: true }); await page.waitForTimeout(100); } }
await page.getByRole('button', { name: 'Open report' }).first().click(); await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'educator-report');
// A saved note, so its date and its Edit and Remove links are measured too (pass JV: in the dark theme they were nearly invisible).
await page.locator('textarea[aria-label="Teacher note"]').first().fill('Reads well on the light card.'); await page.getByRole('button', { name: 'Save note' }).click(); await page.waitForTimeout(250);
await page.getByRole('button', { name: 'Back to Classroom' }).click(); await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'educator-pick');

// Every word on the screen, measured against what it actually sits on (backgrounds stacked up through its parents).
// A gradient counts as every color it passes through, and a word must read on the worst of them (the phone screenshots
// of 2026-09-24 showed light cards the old check had skipped). Words over a picture, inside a drawing, or on a faded
// (disabled) control are left to the eye.
const audit = () => page.evaluate(() => {
  const parse = (s) => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const blend = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
  const under = (el) => {
    const layers = []; let n = el; let stops = null;
    while (n && n.nodeType === 1) {
      const cs = getComputedStyle(n); const img = cs.backgroundImage;
      if (img && img !== 'none') { if (/url\(/.test(img)) return null; const cols = (img.match(/rgba?\([^)]+\)/g) || []).map(parse).filter(Boolean); if (cols.length) { stops = cols; n = n.parentElement; break; } }
      const c = parse(cs.backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a >= 1) return [layers.reduceRight((acc, l) => blend(l, acc), { r: 255, g: 255, b: 255, a: 1 })]; }
      n = n.parentElement;
    }
    let floor = { r: 255, g: 255, b: 255, a: 1 };
    while (n && n.nodeType === 1) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a >= 1) { floor = c; break; } n = n.parentElement; }
    return (stops || [null]).map((s) => { let base = s ? (s.a < 1 ? blend(s, floor) : s) : floor; for (let i = layers.length - 1; i >= 0; i--) base = blend(layers[i], base); return base; });
  };
  const fails = []; const seen = new Set();
  const walker = document.createTreeWalker(document.querySelector('#root'), NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const t = walker.currentNode; const words = t.textContent.trim(); if (!words) continue;
    const el = t.parentElement; if (!el || seen.has(el) || el.closest('svg')) continue; seen.add(el);
    const box = el.getBoundingClientRect(); if (box.width < 1 || box.height < 1) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden') continue;
    let n = el, faded = false; while (n && n.nodeType === 1) { if (parseFloat(getComputedStyle(n).opacity) < 0.9) { faded = true; break; } n = n.parentElement; } if (faded) continue;
    const fg = parse(cs.color); const grounds = under(el); if (!fg || !grounds) continue;
    let ratio = 99, bg = grounds[0];
    for (const g of grounds) { const f = fg.a < 1 ? blend(fg, g) : fg; const r = (Math.max(lum(f), lum(g)) + 0.05) / (Math.min(lum(f), lum(g)) + 0.05); if (r < ratio) { ratio = r; bg = g; } }
    const size = parseFloat(cs.fontSize); const bold = parseInt(cs.fontWeight, 10) >= 700;
    if (ratio < ((size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5)) fails.push(`${ratio.toFixed(2)} "${words.slice(0, 36)}" ${cs.color} on rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`);
  }
  // A picker shows its chosen option's words on the picker itself, so every visible picker is measured too.
  for (const el of document.querySelectorAll('#root select')) {
    const box = el.getBoundingClientRect(); if (box.width < 1 || box.height < 1) continue;
    const cs = getComputedStyle(el); const fg = parse(cs.color); const own = parse(cs.backgroundColor); const grounds = own && own.a >= 1 ? [own] : under(el.parentElement); if (!fg || !grounds) continue;
    for (const g of grounds) { const r = (Math.max(lum(fg), lum(g)) + 0.05) / (Math.min(lum(fg), lum(g)) + 0.05); if (r < 4.5) { fails.push(`${r.toFixed(2)} picker "${(el.selectedOptions[0] || {}).textContent || ''}" ${cs.color}`); break; } }
  }
  return fails;
});
// An educator is signed out after a quiet minute (EDUCATOR_IDLE_MS), so the long walk taps an empty edge of the page as it goes.
const keepAlive = () => page.mouse.click(3, 300).catch(() => {});
// On a wide screen the Classroom starts its laptop tour the first time it is shown, and the tour holds the page there,
// so the wide pass skips it the way an educator would.
const skipTour = async () => { const b = page.getByRole('button', { name: 'Skip tour' }); if (await b.count()) { await b.first().click({ force: true }); await page.waitForTimeout(200); } };
const themeNow = () => page.evaluate(() => document.documentElement.dataset.theme || 'light');
// Dark is the default now (Mikey, 2026-09-24); the switch sits on the welcome page and at the top of the Classroom page.
ok('the Classroom page has the light and dark switch', (await page.getByRole('button', { name: 'Dark theme' }).count()) === 1 && (await page.getByRole('button', { name: 'Light theme' }).count()) === 1);
ok('a new device starts in the dark theme', (await themeNow()) === 'dark' && (await page.evaluate(() => getComputedStyle(document.querySelector('#root > div')).backgroundColor)) === 'rgb(20, 35, 30)');
const paper = new Set(['certificate', 'story-book', 'transcript']);
const check = async (s) => {
  const fails = await audit(); const t = await themeNow();
  if (paper.has(s)) ok(`${s} stays light for printing`, t === 'light', `theme ${t}`);
  else ok(`${s}: every word reads in the dark theme`, t === 'dark' && fails.length === 0, t !== 'dark' ? `theme ${t}` : `${fails.length} low: ${fails.slice(0, 4).join(' | ')}`);
};
await check('educator-pick');
// The Story Log loads its rows when its button is pressed, so it is opened the way an educator opens it.
const storyLog = page.getByRole('button', { name: 'Story Log', exact: true });
ok('the Story Log opens from the Classroom page', (await storyLog.count()) > 0);
if (await storyLog.count()) { await storyLog.first().click(); await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'story-log'); await page.waitForTimeout(250); await check('story-log'); await page.setViewportSize({ width: 1280, height: 900 }); await page.waitForTimeout(250); await check('story-log at 1280'); await page.setViewportSize({ width: 360, height: 780 }); await page.waitForTimeout(200); await page.evaluate(() => window.__eduTest.goTo('educator-pick')); await page.waitForTimeout(200); }
for (const s of screens.filter((x) => !studentScreens.has(x))) {
  await keepAlive(); await page.evaluate((name) => window.__eduTest.goTo(name), s); await page.waitForTimeout(250);
  if (await page.evaluate(() => window.__eduTest.screen) === s) await check(s);
  await page.evaluate(() => window.__eduTest.goTo('educator-pick')); await page.waitForTimeout(200);
}
// Wide screens (Mikey's laptop, 2026-09-24): loose words there sit on a backing plate, so every screen is checked again at 1280.
await page.setViewportSize({ width: 1280, height: 900 }); await page.waitForTimeout(250);
await check('educator-pick at 1280');
for (const s of screens.filter((x) => !studentScreens.has(x) && !paper.has(x))) {
  await keepAlive(); await page.evaluate((name) => window.__eduTest.goTo(name), s); await page.waitForTimeout(250);
  if (await page.evaluate(() => window.__eduTest.screen) === s) await check(`${s} at 1280`);
  await page.evaluate(() => window.__eduTest.goTo('educator-pick')); await page.waitForTimeout(200); await skipTour();
}
await page.setViewportSize({ width: 360, height: 780 }); await page.waitForTimeout(250);
await keepAlive(); await page.getByLabel('Walk through elementary').click({ force: true }); await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'overview');
await page.evaluate(() => window.__eduTest.openModule(window.__eduTest.visibleModuleIds()[0])); await page.waitForTimeout(400);
for (const s of [...screens.filter((x) => studentScreens.has(x) && x !== 'overview'), 'overview']) {
  await page.evaluate((name) => window.__eduTest.goTo(name), s); await page.waitForTimeout(300);
  if (await page.evaluate(() => window.__eduTest.screen) === s) await check(s);
}
// A ruled-out answer on the dark board stays visible (2026-09-29, Mikey): answer a practice question wrong, tap Try again,
// and the greyed choice must keep its ink apart from its background at seven-tenths or more.
{ await keepAlive(); await page.evaluate(() => window.__eduTest.goTo('overview')); await page.waitForTimeout(300);
  // The first unlocked early module: open it, go from its lesson to practice, and wait for a question to appear.
  for (const id of ['count-to-3', 'one-and-two', 'washing-hands', 'tell-and-show', 'wants-needs-and-choices']) {
    await page.evaluate((mid) => window.__eduTest.openModule(mid), id); await page.waitForTimeout(500);
    const sc = await page.evaluate(() => window.__eduTest.screen);
    // A read-aloud lesson can run several spoken lines (since pass JP every lesson speaks all of its teaching), so step
    // through them with Next until the Start practice star appears.
    if (sc === 'lesson') { for (let n = 0; n < 12 && !(await page.getByLabel('Start practice').count()); n++) { const next = page.getByLabel('Next'); if (!(await next.count())) break; await next.first().click(); await page.waitForTimeout(150); }
      const start = page.getByLabel('Start practice'); if (await start.count()) { await start.first().click(); await page.waitForTimeout(500); } }
    if ((await page.evaluate(() => window.__eduTest.screen)) === 'practice') break;
    await page.evaluate(() => window.__eduTest.goTo('overview')); await page.waitForTimeout(200);
  }
  const q0 = await page.evaluate(() => (window.__eduTest && window.__eduTest.question) || null);
  if (q0 && q0.choices && q0.type !== 'number') {
    const wrong = q0.choices.find((c) => c !== q0.answer); const m = /^dots:(\d+)$/.exec(wrong || '');
    const el = m ? page.locator(`button:has(svg[aria-label="${m[1]} dots"])`).first() : page.getByRole('button', { name: wrong, exact: true }).first();
    await el.click(); await page.getByRole('button', { name: 'Check answer' }).click(); await page.waitForTimeout(200);
    const again = page.getByRole('button', { name: 'Try again' }); if (await again.count()) { await again.click(); await page.waitForTimeout(200); }
    const look = await el.evaluate((node) => { const cs = getComputedStyle(node); return { opacity: Number(cs.opacity), color: cs.color, bg: cs.backgroundColor }; });
    ok('a ruled-out answer stays readable on the dark board', look.opacity >= 0.7 && look.color !== look.bg && look.bg === 'rgb(44, 66, 56)', JSON.stringify(look));
  } else ok('a ruled-out answer stays readable on the dark board', false, `no choice question on the practice screen: ${JSON.stringify(q0 && q0.type)}`);
  await page.evaluate(() => window.__eduTest.goTo('overview')); await page.waitForTimeout(200); }
// The colorful rows on the courses page, opened one at a time: they keep their color and their words stay readable.
for (const name of [/Let's Color/, /Let's Play/, /Let's Read/]) {
  const b = page.getByRole('button', { name }).first(); if (!(await b.count())) continue;
  await b.click(); await page.waitForTimeout(300);
  ok(`${name.source.replace(/\\/g, '')} opens in the dark theme with readable words`, (await audit()).length === 0, (await audit()).slice(0, 3).join(' | '));
  await b.click().catch(() => {}); await page.waitForTimeout(200);
}
// Games are played on a paper board in both themes (Mikey's laptop, 2026-09-24): three games whose boards carry words.
for (const title of ['Quick fire: math', 'Space shooter: gases', 'In order: how things happen']) {   // the space shooter took the place of Solid or liquid, which left grade 7 science (pass IN)
  await keepAlive(); await page.evaluate(() => window.__eduTest.goTo('overview')); await page.waitForTimeout(300);
  const lp = page.getByRole('button', { name: "Let's Play" }).first(); if ((await lp.getAttribute('aria-expanded')) !== 'true') { await lp.click(); await page.waitForTimeout(300); }
  const g = page.getByRole('button', { name: new RegExp(title, 'i') }).first();
  if (!(await g.count())) { ok(`${title} is listed in Let's Play`, false); continue; }
  await g.click(); await page.waitForTimeout(900);
  ok(`${title}: the words on its board read in the dark theme`, (await audit()).length === 0, (await audit()).slice(0, 3).join(' | '));
}
// A young learner's course list (Mikey, 2026-09-24): the page knows a young learner is there, every group with something
// ready breathes, and inside an open group every ready module's button invites a tap.
await keepAlive(); await page.evaluate(() => window.__eduTest.goTo('educator-pick')); await page.waitForTimeout(250);
const early = page.getByLabel(/Walk through early/i);
ok('the Classroom page offers an early years walkthrough', (await early.count()) > 0);
if (await early.count()) {
  await early.first().click({ force: true }); await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'overview'); await page.waitForTimeout(300);
  const [beats, groups] = await page.evaluate(() => { const g = [...document.querySelectorAll('button[aria-expanded]')].filter((b) => b.style.getPropertyValue('--beat') !== ''); return [g.filter((b) => b.style.getPropertyValue('--beat') === '1').length, g.length]; });
  ok('a young learner sees every group with something ready breathing', (await page.evaluate(() => document.documentElement.dataset.young)) === '1' && groups >= 2 && beats === groups, `${beats} of ${groups} breathing`);
  await page.evaluate(() => { const b = [...document.querySelectorAll('button[aria-expanded]')].find((x) => x.style.getPropertyValue('--beat') === '1'); if (b) b.click(); }); await page.waitForTimeout(400);
  const pulses = await page.locator('.edu-mod-card .edu-pulse').count(); const cardsNow = await page.locator('.edu-mod-card').count();
  ok('inside the open group every ready module invites a tap', pulses >= 2 && pulses === cardsNow, `${pulses} of ${cardsNow} pulsing`);
  ok('the open group still reads in the dark theme', (await audit()).length === 0, (await audit()).slice(0, 3).join(' | '));
}
await page.reload(); await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen);
ok('the app is still dark after it reloads', (await themeNow()) === 'dark');
await page.evaluate(() => window.__eduTest.goTo('welcome')); await page.waitForTimeout(250);
await page.getByRole('button', { name: 'Light theme' }).click(); await page.waitForTimeout(250);
ok('the sun on the welcome page turns the app light', (await themeNow()) === 'light');
await page.reload(); await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen);
ok('the light choice is remembered after a reload', (await themeNow()) === 'light');
await page.evaluate(() => window.__eduTest.goTo('welcome')); await page.waitForTimeout(250);
await page.getByRole('button', { name: 'Dark theme' }).click(); await page.waitForTimeout(250);
ok('the moon turns it dark again', (await themeNow()) === 'dark');
await page.setViewportSize({ width: 1280, height: 900 }); await page.waitForTimeout(300);
ok('the welcome page reads in the dark theme at 1280', (await audit()).length === 0, (await audit()).slice(0, 3).join(' | '));
await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
