// EduSphere. Copyright (c) 2026. Source-available; not for reuse. See LICENSE.md.
// A pre-commit sweep, not part of check.sh (it takes minutes): opens screens in a real browser and reports script
// errors, console errors and any page wider than the screen. Run tools/sweep.sh; see docs/RELEASE-CHECKLIST.md.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || 'playwright');
const browser = await chromium.launch();
const W = Number(process.env.SWEEP_WIDTH || 360); const page = await browser.newPage({ viewport: { width: W, height: W > 900 ? 800 : 780 }, reducedMotion: 'reduce' });
const errors = []; page.on('pageerror', (e) => errors.push(String(e).slice(0, 160))); let current = ''; page.on('console', (m) => { if (m.type() === 'error') errors.push(current + ' console: ' + m.text().slice(0, 120)); });
await page.goto(pathToFileURL('tests/e2e/page.html').href);
await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'welcome');
await page.getByRole('button', { name: 'Create account' }).click();
await page.fill('input[placeholder="PIN"]', '2468'); await page.fill('input[placeholder="PIN again"]', '2468');
await page.fill('input[placeholder="This device\'s name"]', 'Phone'); await page.selectOption('select[aria-label="Your state"]', 'TX');
await page.getByRole('button', { name: 'Create account', exact: true }).click();
await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'educator-pick');
for (const name of ['Skip tour', 'Later', 'Got it']) { const b = page.getByRole('button', { name }); if (await b.count()) { await b.first().click({ force: true }); await page.waitForTimeout(150); } }
const ids = await page.evaluate(() => window.__eduTest.moduleIds ? window.__eduTest.moduleIds() : null);
const levels = process.argv[2] ? [process.argv[2]] : ['early years', 'elementary', 'middle school', 'high school and beyond'];
const overflow = []; const failed = []; let n = 0;
for (const lv of levels) {
  await page.evaluate(() => window.__eduTest.goHome && window.__eduTest.goHome());
  const b = page.getByLabel('Walk through ' + lv); if (!(await b.count())) { failed.push('no walk-through ' + lv); continue; }
  await b.first().click({ force: true }); await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'overview');
  let mods = await page.evaluate(() => window.__eduTest.visibleModuleIds ? window.__eduTest.visibleModuleIds() : []);
  if (process.argv[3]) { const [a, b] = process.argv[3].split('-').map(Number); mods = mods.slice(a, b); }
  for (const id of mods) {
    try {
      current = id; await page.evaluate((m) => window.__eduTest.openModule(m), id);
      await page.waitForFunction(() => window.__eduTest && (window.__eduTest.screen === 'lesson'), null, { timeout: 2500 });
      await page.waitForTimeout(40);
      const w = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
      if (w[0] > w[1] + 2) overflow.push(id + ':lesson:' + w[0]);
      const vs = page.getByRole('button', { name: 'View story' }); if (await vs.count()) { await vs.first().click(); await page.waitForTimeout(40); const w2 = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]); if (w2[0] > w2[1] + 2) overflow.push(id + ':story:' + w2[0]); await page.getByRole('button', { name: 'Practice this' }).first().click(); }
      else { const p = page.getByRole('button', { name: 'Practice this' }); if (await p.count()) await p.first().click(); }
      await page.waitForTimeout(60);
      const w3 = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth, window.__eduTest.screen]);
      if (w3[0] > w3[1] + 2) overflow.push(id + ':' + w3[2] + ':' + w3[0]);
      n += 1;
    } catch (e) { failed.push(id + ': ' + String(e).slice(0, 80)); }
  }
}
console.log('width', W, 'modules walked', n);
if (overflow.length || failed.length || errors.length) process.exitCode = 1; console.log('overflow', overflow.length, overflow.slice(0, 40).join(' ')); console.log('failed', failed.length, failed.slice(0, 10).join(' | ')); console.log('errors', errors.length, [...new Set(errors)].slice(0, 6).join(' | '));
await browser.close();
