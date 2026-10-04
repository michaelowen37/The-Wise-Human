// Educator housekeeping on the backup page (2026-09-26, Mikey: a Change PIN link under Start over). A wrong current PIN
// and mismatched new PINs are refused in plain words; a good change saves, and the new PIN opens the educator side.
import { createRequire } from 'node:module'; import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
let passed = 0, failed = 0; const ok = (name, cond) => { if (cond) { passed++; console.log('PASS - ' + name); } else { failed++; console.log('FAIL - ' + name); } };
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const text = () => page.evaluate(() => document.body.innerText);
await page.goto(pathToFileURL(new URL('./page.html', import.meta.url).pathname).href);
await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'welcome');
// The starter PIN is retired (pass HB, Mikey). With no educator account on the device, Educator Login goes straight to account
// setup, and the PIN screen, if reached at all, has no PIN box: only the account's own PIN will ever open the educator side.
await page.getByRole('button', { name: 'Educator Login' }).click(); await page.waitForTimeout(300);
ok('with no educator account, Educator Login opens account setup', (await page.evaluate(() => window.__eduTest.screen)) === 'educator-setup');
await page.evaluate(() => window.__eduTest.goTo('educator-pin')); await page.waitForTimeout(300);
ok('with no account the PIN screen has no PIN box and offers Create account', (await page.locator('input[placeholder="PIN"]').count()) === 0 && (await page.getByRole('button', { name: 'Create account' }).count()) >= 1);
await page.getByRole('button', { name: 'Create account' }).first().click(); await page.waitForTimeout(300);
ok('Create account on the PIN screen opens account setup', (await page.evaluate(() => window.__eduTest.screen)) === 'educator-setup');
await page.fill('input[placeholder="PIN"]', '2468'); await page.fill('input[placeholder="PIN again"]', '2468');
await page.fill('input[placeholder="This device\'s name"]', 'G'); await page.selectOption('select[aria-label="Your state"]', 'TX');
await page.getByRole('button', { name: 'Create account', exact: true }).click();
await page.waitForFunction(() => window.__eduTest.screen === 'educator-pick'); await page.waitForTimeout(500);
for (const name of ['Skip tour', 'Later', 'Got it']) { const b = page.getByRole('button', { name }); if (await b.count()) { await b.first().click({ force: true }); await page.waitForTimeout(150); } }
await page.evaluate(() => window.__eduTest.goTo('backup')); await page.waitForTimeout(400);
const t0 = await text();
ok('the Change PIN link sits under Start over', t0.indexOf('Change PIN') > t0.indexOf('Start over as a new educator') && t0.indexOf('Start over as a new educator') > 0);
// With an account, the tour link and Start over sit side by side when there is room, with Change PIN centered on its own line
// below (pass HA). On a phone, held either way, the tour link is gone because the tour does not fit a small screen, and Start over
// and Change PIN sit centered one above the other (pass HC, Mikey).
{ const pos = () => page.evaluate(() => { const card = document.querySelector('[data-account-card="account"]'); const c = card.getBoundingClientRect(); const find = (re) => [...card.querySelectorAll('button')].find((b) => re.test(b.textContent)); const mid = (r) => (r.left + r.right) / 2; const tourBtn = find(/first week tour/); const over = find(/^Start over/).getBoundingClientRect(), pin = find(/^Change PIN/).getBoundingClientRect(); const tour = tourBtn ? tourBtn.getBoundingClientRect() : null; return { hasTour: !!tour, sideBySide: !!tour && Math.abs(tour.top - over.top) < 4, pinBelow: pin.top >= Math.max(tour ? tour.bottom : 0, over.bottom) - 1, overCentered: Math.abs(mid(over) - mid(c)) < 6, pinCentered: Math.abs(mid(pin) - mid(c)) < 6 }; });
  const wide = await pos();
  ok('on a wide screen the tour link and Start over sit side by side, with Change PIN centered below', wide.hasTour && wide.sideBySide && wide.pinBelow && wide.pinCentered);
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(300);
  const narrow = await pos();
  ok('on a phone there is no tour link, and Start over sits centered above a centered Change PIN', !narrow.hasTour && narrow.overCentered && narrow.pinBelow && narrow.pinCentered);
  await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(300);
  const sideways = await pos();
  ok('on a phone turned sideways there is no tour link either', !sideways.hasTour && sideways.pinBelow && sideways.pinCentered);
  await page.setViewportSize({ width: 1280, height: 900 }); await page.waitForTimeout(300); }
await page.getByRole('button', { name: 'Change PIN' }).click(); await page.waitForTimeout(200);
const fill = async (a, b, c) => { await page.fill('input[placeholder="Current PIN"]', a); await page.fill('input[placeholder="New PIN"]', b); await page.fill('input[placeholder="New PIN again"]', c); await page.getByRole('button', { name: 'Save new PIN' }).click(); await page.waitForTimeout(250); };
await fill('1111', '1357', '1357');
ok('a wrong current PIN is refused', (await text()).includes('That is not the current PIN.'));
await fill('2468', '1357', '1358');
ok('two new PINs that differ are refused', (await text()).includes('The two new PINs do not match.'));
await fill('2468', '135', '135');
ok('a new PIN under four digits is refused', (await text()).includes('The new PIN needs at least four digits.'));
await fill('2468', '1357', '1357');
ok('a good change is saved and says so', (await text()).includes('Your PIN is changed.'));
await page.evaluate(() => window.__eduTest.goTo('educator-pin')); await page.waitForTimeout(300);
await page.fill('input[placeholder="PIN"]', '2468'); await page.waitForTimeout(300);
const oldStillOut = await page.evaluate(() => window.__eduTest.screen === 'educator-pin');
await page.fill('input[placeholder="PIN"]', ''); await page.waitForTimeout(100);
await page.fill('input[placeholder="PIN"]', '1357'); await page.waitForTimeout(400);
ok('the old PIN no longer opens the educator side, and the new one does', oldStillOut && (await page.evaluate(() => window.__eduTest.screen)) !== 'educator-pin');
await browser.close();
console.log(`${passed} passed, ${failed} failed`); process.exitCode = failed ? 1 : 0;
