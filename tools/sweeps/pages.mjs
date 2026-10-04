// EduSphere. Copyright (c) 2026. Source-available; not for reuse. See LICENSE.md.
// A pre-commit sweep, not part of check.sh (it takes minutes): opens screens in a real browser and reports script
// errors, console errors and any page wider than the screen. Run tools/sweep.sh; see docs/RELEASE-CHECKLIST.md.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || 'playwright');
const browser = await chromium.launch();
const W = Number(process.env.SWEEP_WIDTH || 360); const page = await browser.newPage({ viewport: { width: W, height: W > 900 ? 800 : 780 }, reducedMotion: 'reduce' });
const errors = []; let current = 'start'; page.on('pageerror', (e) => errors.push(current + ': ' + String(e).slice(0, 140))); page.on('console', (m) => { if (m.type() === 'error') errors.push(current + ' console: ' + m.text().slice(0, 120)); });
const over = []; const check = async (tag) => { current = tag; await page.waitForTimeout(80); const w = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]); if (w[0] > w[1] + 2) over.push(tag + ':' + w[0]); };
await page.goto(pathToFileURL('tests/e2e/page.html').href);
await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'welcome'); await check('welcome');
await page.getByRole('button', { name: 'Create account' }).click(); await check('create');
await page.fill('input[placeholder="PIN"]', '2468'); await page.fill('input[placeholder="PIN again"]', '2468');
await page.fill('input[placeholder="This device\'s name"]', 'Phone'); await page.selectOption('select[aria-label="Your state"]', 'TX');
await page.getByRole('button', { name: 'Create account', exact: true }).click();
await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'educator-pick');
for (const name of ['Skip tour', 'Later', 'Got it']) { const b = page.getByRole('button', { name }); if (await b.count()) { await b.first().click({ force: true }); await page.waitForTimeout(150); } }
await check('classroom-empty');
// every game in a walk-through
await page.getByLabel('Walk through high school and beyond').click({ force: true });
await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'overview'); await check('overview-high');
await page.getByRole('button', { name: "Let's Play" }).click(); await page.waitForTimeout(150);
const games = await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => b.getAttribute('aria-label') || '').filter((x) => /^Play /.test(x)));
// Inside a game box nothing may be wider than its box (2026-09-23): the pairs cards overflowed once their words showed,
// and the page itself never widened, so this looks inside .edu-game-box with every pair of cards turned over.
const inBox = async (tag) => { const bad = await page.evaluate(() => { const out = []; for (const root of document.querySelectorAll('.edu-game-box')) for (const el of [root, ...root.querySelectorAll('div')]) if (el.scrollWidth > el.clientWidth + 1) out.push((el.className || el.tagName) + ':' + el.scrollWidth + '>' + el.clientWidth); return out; }); if (bad.length) over.push(tag + ' inside ' + bad.join(',')); };
for (const g of games) {
  await page.getByRole('button', { name: g }).click(); await check('game ' + g); await inBox('game ' + g);
  const cards = page.locator('button[aria-label="Card"]'); const cardCount = await cards.count();
  for (let i = 0; i < cardCount; i += 2) { await cards.nth(0).click(); await page.waitForTimeout(30); await cards.nth(0).click(); await page.waitForTimeout(30); await inBox('game ' + g + ' flipped'); await page.waitForTimeout(720); }
  const inst = page.getByRole('button', { name: 'Instructions', exact: true }); if (await inst.count()) { await inst.click(); await check('instructions ' + g); await page.getByRole('button', { name: 'Got it' }).click(); }
  await page.getByRole('button', { name: 'Close game' }).click(); await page.waitForTimeout(120);
  if (!(await page.getByRole('button', { name: games[0] }).count())) { await page.getByRole('button', { name: "Let's Play" }).click(); await page.waitForTimeout(120); }
}
// Let's Read and a course story
await page.getByRole('button', { name: "Let's Read" }).click(); await check('lets-read');
await page.getByRole('button', { name: 'Read', exact: true }).first().click(); await check('course-story');
await page.getByRole('button', { name: 'Back to my courses' }).click();
// my progress
const mp = page.getByRole('button', { name: /My progress/ }); if (await mp.count()) { await mp.first().click(); await check('my-progress'); }
await page.evaluate(() => window.__eduTest.goHome());
await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'educator-pick');
// early years: coloring pages and every early game
await page.getByLabel('Walk through early years').click({ force: true });
await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'overview'); await check('overview-early');
const pics = ['cat', 'A', 'aquarium', 'dinosaur-valley'];
for (const p of pics) { await page.evaluate((x) => window.__eduTest.openColoring(x), p); await check('coloring ' + p); await page.evaluate(() => window.__eduTest.goHome && null); await page.getByRole('button', { name: /Done|Back|Close|Finished/ }).first().click().catch(() => {}); await page.waitForTimeout(100); if ((await page.evaluate(() => window.__eduTest.screen)) !== 'overview') { await page.evaluate(() => window.__eduTest.openModule('count-to-5')); await page.waitForTimeout(150); await page.getByRole('button', { name: 'Back' }).first().click().catch(() => {}); } }
await page.evaluate(() => window.__eduTest.goHome());
await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'educator-pick');
// educator pages with a real student
await page.getByRole('button', { name: 'Add someone new' }).click(); await page.fill('input[placeholder="School-issued ID"]', 'S-5001');
await page.getByRole('button', { name: /^Elementary/ }).click(); await page.getByRole('button', { name: 'Add', exact: true }).click(); await page.waitForTimeout(300);
for (const name of ['Done', 'Not now', 'Skip', 'Later', 'Got it']) { const b = page.getByRole('button', { name }); if (await b.count()) { await b.first().click({ force: true }); await page.waitForTimeout(100); } }
// a second student, so Who needs help (which needs two) is on the page
await page.getByRole('button', { name: 'Add someone new' }).click(); await page.fill('input[placeholder="School-issued ID"]', 'S-5002');
await page.getByRole('button', { name: /^Middle school/ }).click(); await page.getByRole('button', { name: 'Add', exact: true }).click(); await page.waitForTimeout(300);
for (const name of ['Done', 'Not now', 'Skip', 'Later', 'Got it']) { const b = page.getByRole('button', { name }); if (await b.count()) { await b.first().click({ force: true }); await page.waitForTimeout(100); } }
await check('classroom-two');
for (const [name, tag] of [['Open report', 'report'], ['Story log', 'story-log-one']]) { const b = page.getByRole('button', { name }); if (await b.count()) { await b.first().click(); await check(tag); const back = page.getByRole('button', { name: /Back to report|Back to Classroom/ }); if (tag !== 'report' && await back.count()) await back.first().click(); } }
for (const [name, tag] of [['Standards map', 'standards-map'], ['Transcript', 'transcript']]) { const b = page.getByRole('button', { name }); if (await b.count()) { await b.first().click(); await check(tag); await page.getByRole('button', { name: /Back/ }).first().click().catch(() => {}); await page.waitForTimeout(100); } }
await page.evaluate(() => window.__eduTest.goHome()); await page.waitForTimeout(150);
for (const [name, tag] of [['Backup classroom', 'backup'], ['Wonder Questions', 'wonder-page'], ['Reading Lists', 'reading-lists'], ['Experiments', 'experiments-page'], ['Life Skills', 'life-skills'], [/Who needs help/, 'class-view']]) { await page.evaluate(() => window.__eduTest.goHome()); await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'educator-pick'); await page.waitForTimeout(200); const b = page.getByRole('button', { name }); if (await b.count()) { await b.first().click({ force: true }); await check(tag); } else over.push('missing ' + name); }
console.log('width', W, 'games', games.length);
if (over.filter((x) => !x.startsWith('missing')).length || errors.length) process.exitCode = 1; console.log('overflow', over.length, over.join(' | ')); console.log('errors', errors.length, [...new Set(errors)].slice(0, 8).join(' | '));
await browser.close();
