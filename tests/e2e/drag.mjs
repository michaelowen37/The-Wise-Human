// Dragging with a desktop mouse (2026-09-26, Mikey: on a desktop nothing dragged, though a long press looked as if it
// would). A mouse drag moves a piece; it still moves when the browser refuses pointer capture, as Safari can; and the
// browser's own drag of anything inside a game board is stopped, so it cannot cancel the game's drag.
import { createRequire } from 'node:module'; import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
let passed = 0, failed = 0; const ok = (name, cond) => { if (cond) { passed++; console.log('PASS - ' + name); } else { failed++; console.log('FAIL - ' + name); } };
const browser = await chromium.launch();
// Every tap waits out the page's settle window (pass JM): a new screen asks for its top again at 80 and 320 ms, and a tap whose
// scroll lands inside that window is undone before it arrives. The app marks the window's end in window.__eduSettleUntil.
function settleTaps(pg) { const proto = Object.getPrototypeOf(pg.locator('body')); if (proto.__settleWrapped) return; const click = proto.click; proto.click = async function (...a) { await this.page().waitForFunction(() => !window.__eduSettleUntil || Date.now() >= window.__eduSettleUntil, null, { timeout: 5000 }).catch(() => {}); return click.apply(this, a); }; proto.__settleWrapped = true; }
async function setup(refuseCapture) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  if (refuseCapture) await page.addInitScript(() => { Element.prototype.setPointerCapture = function () { throw new Error('refused'); }; });
  settleTaps(page);
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
  // The new screen asks for its top again at 80 and 320 ms, so the first tap waits for that (pass JK: the settle-scroll race
  // twice sent the Let's Play tap to the wrong spot, and the games list never opened).
  await page.waitForTimeout(400);
  return page;
}
async function openGame(page, title) {
  await page.getByRole('button', { name: "Let's Play" }).first().click({ force: true }); await page.waitForTimeout(400);
  await page.getByRole('button', { name: title }).first().click({ force: true }); await page.waitForTimeout(1300);
}
async function dragFirst(page) {
  const box = page.locator('.edu-game-box').first(); const item = box.locator('[style*="cursor: grab"]').first();
  const b = await item.boundingBox(); const bb = await box.boundingBox(); const before = await item.evaluate((el) => el.style.left + ' ' + el.style.top);
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(250);
  for (let k = 1; k <= 10; k++) { await page.mouse.move(b.x + b.width / 2 + (bb.x + bb.width * 0.25 - b.x - b.width / 2) * k / 10, b.y + b.height / 2 + (bb.y + bb.height * 0.8 - b.y - b.height / 2) * k / 10); await page.waitForTimeout(25); }
  const mid = await item.evaluate((el) => el.style.left + ' ' + el.style.top);
  await page.mouse.up(); await page.waitForTimeout(300);
  return { before, mid };
}
let page = await setup(false);
await openGame(page, 'Play Big and Small');
let r = await dragFirst(page);
ok('a desktop mouse drags a piece across the board', r.mid !== r.before && r.mid.startsWith('25%'));
ok('the board turns off selection for every browser, Safari included', await page.locator('.edu-game-box').first().evaluate((el) => el.style.userSelect === 'none' && el.style.webkitUserSelect === 'none'));
const prevented = await page.locator('.edu-game-box').first().evaluate((el) => { const ev = new Event('dragstart', { bubbles: true, cancelable: true }); (el.firstElementChild || el).dispatchEvent(ev); return ev.defaultPrevented; });
ok('the browser cannot start its own drag inside a game board', prevented === true);
await page.close();
page = await setup(true);
await openGame(page, 'Play Red and Blue');
r = await dragFirst(page);
ok('a drag still works when the browser refuses pointer capture, as Safari can', r.mid !== r.before && r.mid.startsWith('25%'));
// The student cards on the Classroom page (2026-09-26, Mikey: this is the drag he meant). Press and hold a card with the
// mouse, move it below the others, and let go: the order changes and stays.
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(pathToFileURL(new URL('./page.html', import.meta.url).pathname).href);
  await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'welcome');
  await page.getByRole('button', { name: 'Create account' }).click(); await page.waitForTimeout(300);
  await page.fill('input[placeholder="PIN"]', '2468'); await page.fill('input[placeholder="PIN again"]', '2468');
  await page.fill('input[placeholder="This device\'s name"]', 'G'); await page.selectOption('select[aria-label="Your state"]', 'TX');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await page.waitForFunction(() => window.__eduTest.screen === 'educator-pick'); await page.waitForTimeout(500);
  for (const name of ['Skip tour', 'Later', 'Got it']) { const b = page.getByRole('button', { name }); if (await b.count()) { await b.first().click({ force: true }); await page.waitForTimeout(150); } }
  for (const id of ['S-3001', 'S-3002', 'S-3003']) {
    await page.getByRole('button', { name: 'Add someone new' }).first().click(); await page.waitForTimeout(200);
    await page.fill('input[placeholder="School-issued ID"]', id);
    await page.getByRole('button', { name: /^Elementary/ }).first().click();
    await page.getByRole('button', { name: 'Add', exact: true }).click(); await page.waitForTimeout(400);
  }
  const order = () => page.evaluate(() => { const t = document.body.innerText; return ['S-3001', 'S-3002', 'S-3003'].map((id) => [id, t.indexOf(id)]).sort((a, b) => a[1] - b[1]).map((x) => x[0]).join(' '); });
  const before = await order();
  const first = await page.getByText('S-3001', { exact: true }).first().boundingBox();
  const last = await page.getByText('S-3003', { exact: true }).first().boundingBox();
  await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2); await page.mouse.down(); await page.waitForTimeout(650);
  const target = last.y + last.height + 120;
  for (let k = 1; k <= 12; k++) { await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2 + (target - first.y - first.height / 2) * k / 12); await page.waitForTimeout(30); }
  const lifted = await page.evaluate(() => [...document.querySelectorAll('div')].some((d) => /translateY\((?!0px)/.test(d.style.transform || '')));
  await page.mouse.up(); await page.waitForTimeout(700);
  const after = await order();
  ok('a held student card follows a desktop mouse', lifted === true);
  ok('letting go below the others moves the student to the end', before === 'S-3001 S-3002 S-3003' && after === 'S-3002 S-3003 S-3001');
  const stored = await page.evaluate(async () => { const r = JSON.parse((await window.storage.get('edusphere_v1_roster')).value); return r.students.filter((x) => typeof x.order === 'number').sort((x, y) => x.order - y.order).map((x) => x.label).join(' '); });
  ok('the new order is saved with the classroom', stored === 'S-3002 S-3003 S-3001');
  await page.close();
}
await browser.close();
console.log(`${passed} passed, ${failed} failed`); process.exitCode = failed ? 1 : 0;
