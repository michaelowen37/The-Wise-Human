// The standalone page (index.html), the one GitHub Pages serves. Opens it in a real browser, signs in as an educator, adds a student,
// reloads the page, and checks the student is still there. That is the whole promise of
// local-first: what you did survives a reload because it lives in the browser's storage.
import { createRequire } from 'node:module'; import { execSync } from 'node:child_process'; import { pathToFileURL } from 'node:url';
const G = execSync('npm root -g').toString().trim(); const { chromium } = createRequire(import.meta.url)(`${G}/playwright`);
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const page = await ctx.newPage();
const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
const url = pathToFileURL('index.html').href;
await page.goto(url);
await page.getByRole('button', { name: 'Create account' }).click();
await page.fill('input[placeholder="PIN"]', '2468');
await page.fill('input[placeholder="PIN again"]', '2468');
await page.fill('input[placeholder="This device\'s name"]', 'Front desk');
await page.selectOption('select[aria-label="Your state"]', 'CA');
await page.getByRole('button', { name: 'Create account', exact: true }).click();
{ const skip = page.getByRole('button', { name: 'Skip tour' }); if (await skip.count()) await skip.click({ force: true }); }
{ const later = page.getByRole('button', { name: 'Later' }); if (await later.count()) await later.click(); }
// The What's new pop-up appears once per build on the real page, on a phone too, and shows the newest block of
// docs/WHATS-NEW.md whole (2026-09-28, pass FR: it had been dark since September 24, when the headings gained spaces).
const { newestNews } = await import('../tools/whats-new.mjs'); const { readFileSync } = await import('node:fs');
const wantNews = newestNews(readFileSync('docs/WHATS-NEW.md', 'utf8'));
await page.waitForTimeout(400);
// One pop-up at a time (pass HL): wait for the first-backup reminder, check What's new is not open beneath it, then answer it.
await page.waitForTimeout(1200);
const reminder = page.getByText('Make your first backup soon');
const oneAtATime = !((await reminder.count()) && (await page.getByRole('dialog', { name: "What's new" }).count()));
if (await reminder.count()) { await page.getByRole('button', { name: 'Later', exact: true }).first().click(); await page.waitForTimeout(500); }
const newsSeen = { shown: (await page.getByRole('dialog', { name: "What's new" }).count()) === 1, text: '' };
if (newsSeen.shown) newsSeen.text = await page.getByRole('dialog', { name: "What's new" }).textContent();
// More Details (pass HL, Mikey): the pop-up shows short notes and a centered link to a page with every note in full.
const details = { link: (await page.getByRole('button', { name: 'More Details' }).count()) === 1, text: '' };
if (details.link) { await page.getByRole('button', { name: 'More Details' }).click(); await page.waitForTimeout(300); details.text = await page.textContent('#root'); await page.getByRole('button', { name: 'Back to Classroom' }).click(); await page.waitForTimeout(300); }
{ const got = page.getByRole('button', { name: 'Got it' }); if (await got.count()) await got.click(); }
await page.waitForTimeout(200);
const newsGone = (await page.getByRole('dialog', { name: "What's new" }).count()) === 0;
await page.getByRole('button', { name: 'Add someone new' }).click();
await page.fill('input[placeholder="School-issued ID"]', 'S-777');
await page.getByRole('button', { name: /^Elementary/ }).click();
await page.getByRole('button', { name: 'Add', exact: true }).click();
await page.waitForTimeout(300);
const before = await page.textContent('#root');
await page.reload();
await page.waitForTimeout(800);
const after = await page.textContent('#root');
let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; console.log('PASS -', name); } else { fail++; console.log('FAIL -', name); } };
ok('the standalone page runs and a student can be added', before.includes('S-777'));
ok('what was done survives a reload, because it lives in the browser', after.includes('S-777'));
const createOffered = (await page.getByRole('button', { name: 'Create account' }).count()) > 0;
ok('the account, device name and state are remembered too', !createOffered);
ok('no browser errors on the standalone page', errors.length === 0);
ok("the What's new pop-up opens on a phone with the newest block in short notes, at most four", !!wantNews && newsSeen.shown && newsSeen.text.includes(wantNews.date) && wantNews.brief.slice(0, 4).every((t) => newsSeen.text.includes(t)) && newsGone);
ok('the backup reminder and What\'s new never open at the same time, so every button can be tapped', oneAtATime);
ok("More Details opens a page with every note of the newest block in full, and closes the pop-up", details.link && wantNews.items.every((t) => details.text.includes(t)));
const newsAfter = (await page.getByRole('dialog', { name: "What's new" }).count()) === 0;
ok("What's new stays closed after a reload, because Got it was remembered", newsAfter);
await b.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;   // never process.exit(): it can drop the last lines of a piped stdout (2026-09-23)
