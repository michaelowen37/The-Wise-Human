// The Wise Human. Copyright (c) 2026. Source-available; not for reuse. See LICENSE.md.
// The back-button sweep (2026-09-24, Mikey): land on every screen the app can be on, press the phone's back button, and
// fail if any lands on the loading screen, stays where it was, or leaves the app. Run: node tests/e2e/make-page.mjs && node tests/e2e/back-sweep.mjs
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
let pass = 0, fail = 0;
const ok = (label, cond, detail = '') => { console.log((cond ? 'PASS' : 'FAIL') + ' - ' + label + (cond || !detail ? '' : '  ' + detail)); cond ? pass++ : fail++; };
// Every screen the source can set, minus the ones that only exist mid-flow (a result after an answer, a sent piece of
// writing, a wonder question being spoken); the click-through test presses through those.
const src = readFileSync('src/ui.jsx', 'utf8');
const screens = [...new Set([...src.matchAll(/setScreen\('([a-z-]+)'\)/g)].map((m) => m[1]))].filter((s) => !['welcome', 'loading', 'result', 'quick-result', 'placement-result', 'checkpoint-result', 'writing-sent', 'wonder-voices', 'wonder', 'practice', 'educator-pin', 'educator-setup'].includes(s));
const studentScreens = new Set(['overview', 'lesson', 'story', 'coloring', 'course-story', 'my-progress']);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 360, height: 780 }, reducedMotion: 'reduce', hasTouch: true });
// These checks were written for the light theme; the dark theme has its own check (dark-contrast.mjs).
await page.addInitScript(() => { try { if (!window.localStorage.getItem('edusphere_v1_theme')) window.localStorage.setItem('edusphere_v1_theme', 'light'); } catch (e) { /* storage may be off */ } });
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
await page.getByRole('button', { name: 'Back to Classroom' }).click(); await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'educator-pick');
// A render that throws leaves #root empty and the test hook frozen on its last good screen, which is exactly what the
// original bug looked like (a blank page that never loads), so an empty root counts as a failure on its own.
const state = async () => page.evaluate(() => { const root = document.querySelector('#root'); const words = root ? (root.textContent || '') : ''; return { screen: window.__eduTest ? window.__eduTest.screen : 'gone', empty: !root || root.childElementCount === 0 || !words.trim() || words.includes('Something went wrong on this page') }; });
const pressBack = async () => { await page.goBack().catch(() => {}); await page.waitForTimeout(350); };
// Educator context: no student signed in.
for (const s of screens.filter((x) => !studentScreens.has(x))) {
  await page.evaluate((name) => window.__eduTest.goTo(name), s); await page.waitForTimeout(250);
  const before = await state();
  if (before.screen !== s || before.empty) { ok(`${s} renders when reached as an educator`, false, before.empty ? 'blank page' : `landed on ${before.screen}`); continue; }
  await pressBack(); const after = await state();
  ok(`back from ${s} (educator) lands somewhere real`, page.url() === url && after.screen !== 'gone' && after.screen !== 'loading' && after.screen !== s && !after.empty, after.empty ? 'blank page' : `${before.screen} -> ${after.screen}`);
  // back to the classroom for the next one
  await page.evaluate(() => window.__eduTest.goTo('educator-pick')); await page.waitForTimeout(200);
}
// Student context: the elementary walk-through, with one lesson opened so module screens have a module.
await page.getByLabel('Walk through elementary').click({ force: true }); await page.waitForFunction(() => window.__eduTest && window.__eduTest.screen === 'overview');
await page.evaluate(() => window.__eduTest.openModule(window.__eduTest.visibleModuleIds()[0])); await page.waitForTimeout(400);
// Back from the courses page ends the walk-through and drops the record, so the courses page goes last.
for (const s of [...screens.filter((x) => studentScreens.has(x) && x !== 'overview'), 'overview']) {
  await page.evaluate((name) => window.__eduTest.goTo(name), s); await page.waitForTimeout(300);
  const before = await state();
  if (before.screen !== s || before.empty) { ok(`${s} renders when reached as a student`, false, before.empty ? 'blank page' : `landed on ${before.screen}`); continue; }
  await pressBack(); const after = await state();
  ok(`back from ${s} (student) lands somewhere real`, page.url() === url && after.screen !== 'gone' && after.screen !== 'loading' && after.screen !== s && !after.empty, after.empty ? 'blank page' : `${before.screen} -> ${after.screen}`);
  if (s !== 'overview') { await page.evaluate(() => window.__eduTest.goTo('overview')); await page.waitForTimeout(200); }
}
await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
