// Licensing in the browser (2026-09-25): a new elementary student sees nothing until the educator saves a code that checks
// out, a bad code is refused in plain words, and the saved code opens grade 1 and up. Runs on page-licensed.html.
import { createRequire } from 'node:module'; import { pathToFileURL } from 'node:url'; import { readFileSync } from 'node:fs';
import { makeLicenseCode, COURSES, courseIsFree } from '../../src/logic.mjs';
const paidModules = new Set(COURSES.filter((c) => !courseIsFree(c)).flatMap((c) => c.modules.map((m) => m.id))); // grade 1 and up
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
let passed = 0, failed = 0; const ok = (name, cond) => { if (cond) { passed++; console.log('PASS - ' + name); } else { failed++; console.log('FAIL - ' + name); } };
const devKey = JSON.parse(readFileSync(new URL('../fixtures/dev-license-private.json', import.meta.url), 'utf8'));
const code = await makeLicenseCode(devKey, { id: 'TX-E2E-1', name: 'S-3001', year: '2026-27', until: '2099-07-31' });
const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const text = () => page.evaluate(() => document.body.innerText);
await page.goto(pathToFileURL(new URL('./page-licensed.html', import.meta.url).pathname).href);
await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'welcome');
await page.getByRole('button', { name: 'Create account' }).click(); await page.waitForTimeout(300);
await page.fill('input[placeholder="PIN"]', '2468'); await page.fill('input[placeholder="PIN again"]', '2468');
await page.fill('input[placeholder="This device\'s name"]', 'G'); await page.selectOption('select[aria-label="Your state"]', 'TX');
await page.getByRole('button', { name: 'Create account', exact: true }).click();
await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'educator-pick'); await page.waitForTimeout(500);
for (const name of ['Skip tour', 'Later', 'Got it']) { const b = page.getByRole('button', { name }); if (await b.count()) { await b.first().click({ force: true }); await page.waitForTimeout(150); } }
await page.getByRole('button', { name: 'Add someone new' }).first().click(); await page.waitForTimeout(200);
await page.fill('input[placeholder="School-issued ID"]', 'S-3001');
await page.getByRole('button', { name: /^Elementary/ }).first().click();
await page.getByRole('button', { name: 'Add', exact: true }).click(); await page.waitForTimeout(500);
await page.evaluate(() => window.__eduTest.goTo('welcome')); await page.waitForTimeout(300);
await page.getByRole('button', { name: /S-3001$/ }).click();
await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'overview'); await page.waitForTimeout(400);
ok('without a code, an elementary student sees no modules', (await page.evaluate(() => window.__eduTest.visibleModuleIds().length)) === 0);
ok('and is told the courses are waiting for a code', (await text()).includes('Some of your courses are waiting for a license code.'));
// An educator's walk-through is never gated by licenses (2026-10-01, pass HJ, Mikey): before any code is saved, walking
// through as a student still opens paid courses (grade 1 and up) and their lessons, whether or not anyone has paid.
await page.evaluate(() => window.__eduTest.goTo('educator-pick')); await page.waitForTimeout(400);
{ const walk = page.getByRole('button', { name: /^Walk through elementary/i });
  if (await walk.count()) { await walk.first().click(); await page.waitForTimeout(500); }
  await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'overview', null, { timeout: 8000 }).catch(() => {});
  const ids = await page.evaluate(() => window.__eduTest.visibleModuleIds());
  ok("an educator's walk-through opens paid courses with no code saved", ids.some((id) => paidModules.has(id)) && !(await text()).includes('waiting for a license code'));
}
await page.evaluate(() => window.__eduTest.goTo('educator-pick')); await page.waitForTimeout(400);
await page.evaluate(() => window.__eduTest.goTo('educator-pick')); await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Open report' }).first().click();
await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'educator-report'); await page.waitForTimeout(300);
ok('the report offers a place for the code and says pre-K and kindergarten are free', (await page.locator('input[aria-label="License code"]').count()) === 1 && (await text()).includes('Pre-K and kindergarten are free.'));
await page.fill('input[aria-label="License code"]', 'hello'); await page.getByRole('button', { name: 'Check code' }).click(); await page.waitForTimeout(300);
ok('a bad code is refused in plain words', (await text()).includes('That is not a license code from The Wise Human.'));
await page.fill('input[aria-label="License code"]', code); await page.getByRole('button', { name: 'Check code' }).click(); await page.waitForTimeout(600);
ok('a good code is saved and shows its last day', (await text()).includes('Licensed through July 31, 2099'));
await page.evaluate(() => window.__eduTest.goTo('welcome')); await page.waitForTimeout(300);
await page.getByRole('button', { name: /S-3001$/ }).click();
await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'overview'); await page.waitForTimeout(500);
ok('with the code saved, grade 1 and up opens for the student', (await page.evaluate(() => window.__eduTest.visibleModuleIds().length)) > 0 && !(await text()).includes('waiting for a license code'));
await browser.close();
console.log(`${passed} passed, ${failed} failed`); process.exitCode = failed ? 1 : 0;
