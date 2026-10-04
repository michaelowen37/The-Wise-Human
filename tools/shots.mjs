// Screenshots of modules at phone width, for the changes zip: node tools/shots.mjs <outdir> <moduleId>...
// Each module is opened through a walkthrough of its own band, straight by id through the test hook.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
const HERE = process.cwd();
const G = execSync('npm root -g').toString().trim();
const { chromium } = createRequire(import.meta.url)(`${G}/playwright`);
const L = await import(pathToFileURL(`${HERE}/src/logic.mjs`).href);
const [outDir, ...ids] = process.argv.slice(2);
if (!ids.length) { console.log('no modules to shoot'); process.exit(0); }
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', hasTouch: true });
await page.goto(pathToFileURL(`${HERE}/tests/e2e/page.html`).href);
const tap = async (label) => { await page.getByRole('button', { name: label, exact: true }).first().click(); };
const screenIs = (name) => page.waitForFunction((n) => window.__eduTest && window.__eduTest.screen === n, name);
await tap('Create account');
await screenIs('educator-setup');
await page.fill('input[placeholder="PIN"]', '2468'); await page.fill('input[placeholder="PIN again"]', '2468');
await page.fill('input[placeholder="This device\'s name"]', 'Screenshots'); await page.selectOption('select[aria-label="Your state"]', 'TX');
await page.getByRole('button', { name: 'Create account', exact: true }).click();
await screenIs('educator-pick');
await page.waitForTimeout(200);
const later = page.getByRole('button', { name: 'Later' }); if (await later.count()) await later.click();
const levelFor = { early: 'early', growing: 'elementary', teen: 'middle', grown: 'high' };
for (const id of ids) {
  const m = L.getModule(id); if (!m) { console.log('unknown module', id); continue; }
  const course = L.getCourse(m.courseId);
  const level = L.LEVELS.find((lv) => lv.id === levelFor[L.stageForGrade(course.grade)]);
  await page.getByRole('button', { name: `Walk through ${level.title.toLowerCase()}` }).click();
  await screenIs('overview');
  await page.waitForTimeout(300);
  await page.evaluate((mid) => window.__eduTest.openModule(mid), id);
  await screenIs('lesson');
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${outDir}/${id}.png`, fullPage: false });
  await page.getByRole('button', { name: /^Back/ }).first().click();
  await screenIs('overview');
  await tap('Exit');
  await screenIs('educator-pick');
  console.log('shot', id);
}
await browser.close();
