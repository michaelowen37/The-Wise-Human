// -----------------------------------------------------------------------------------------------------------------
// The updater test (pass JV). In plain terms: tools/update-from-zip.sh is how Mikey's folder takes a new delivery
// without numbered copies ("index 2.html") piling up. This test builds a small make-believe repository the way his
// looked (numbered copies committed, leftovers from the old changes-only zip, his own .gitattributes and pictures),
// runs the updater with a small make-believe delivery, and checks that the folder then matches the delivery
// exactly, that his own things survive, and that it refuses to run while anything is uncommitted.
// -----------------------------------------------------------------------------------------------------------------
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync, rmSync, statSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOL = join(dirname(fileURLToPath(import.meta.url)), '..', 'tools', 'update-from-zip.sh');
let passed = 0; let failed = 0;
const check = (ok, what) => { if (ok) passed++; else { failed++; console.log('FAIL', what); } };
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const write = (root, path, text) => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), text); };

const base = mkdtempSync(join(tmpdir(), 'wise-update-test-'));
try {
  // The delivery: a tiny project with the two files the updater looks for.
  const delivery = join(base, 'delivery');
  for (const [p, t] of [['index.html', 'new page'], ['src/logic.mjs', 'new logic'], ['.gitignore', 'node_modules/\n.DS_Store\n'], ['.nojekyll', ''], ['docs/NOTES.md', 'notes'], ['art/stories/README.md', 'art readme'], ['build.sh', '#!/bin/sh\n']]) write(delivery, p, t);
  run('chmod', ['+x', join(delivery, 'build.sh')], base);

  // The repository, as Mikey's looked: older files, numbered copies, leftovers and his own things, all committed.
  const repo = join(base, 'repo');
  mkdirSync(repo);
  run('git', ['init', '-q', '.'], repo);
  run('git', ['config', 'user.email', 'test@example.com'], repo);
  run('git', ['config', 'user.name', 'test'], repo);
  for (const [p, t] of [['index.html', 'old page'], ['index 2.html', 'old page'], ['src/logic.mjs', 'old logic'], ['.gitignore', 'node_modules/\n.DS_Store\n'], ['.gitignore 2', 'x'], ['.nojekyll', ''], ['.nojekyll 3', ''], ['sw 5.js', 'x'], ['docs/NOTES 2.md', 'x'], ['CHANGES.md', 'old'], ['screenshots/m1.png', 'png'], ['.gitattributes', '* text=auto\n'], ['art/stories/S7.webp', 'painting'], ['art/stories/README 2.md', 'x'], ['audio/clip1.mp3', 'sound'], ['build.sh', '#!/bin/sh\n']]) write(repo, p, t);
  run('git', ['add', '-A'], repo);
  run('git', ['commit', '-q', '-m', 'with copies'], repo);
  write(repo, 'node_modules/x/index.js', 'ignored');   // ignored: must be left alone
  write(repo, 'sw 6.js', 'x');                          // an untracked numbered copy made after the commit

  // 1. It refuses while a real change is uncommitted.
  write(repo, 'docs/MINE.md', 'my own note');
  let refused = false;
  try { run('bash', [TOOL, delivery], repo); } catch (e) { refused = /Stopped/.test(String(e.stdout)); }
  check(refused, 'stops while a change is uncommitted');
  check(readFileSync(join(repo, 'index.html'), 'utf8') === 'old page', 'touches nothing when it stops');
  rmSync(join(repo, 'docs/MINE.md'));

  // 2. It runs, and the folder matches the delivery apart from what it keeps.
  const out = run('bash', [TOOL, delivery], repo);
  check(/Done: \d+ files removed/.test(out), 'reports what it did');
  for (const gone of ['index 2.html', '.gitignore 2', '.nojekyll 3', 'sw 5.js', 'sw 6.js', 'docs/NOTES 2.md', 'CHANGES.md', 'screenshots/m1.png', 'art/stories/README 2.md']) check(!existsSync(join(repo, gone)), `removes ${gone}`);
  check(!existsSync(join(repo, 'screenshots')), 'removes the folder left empty');
  for (const kept of ['.gitattributes', 'art/stories/S7.webp', 'audio/clip1.mp3', 'node_modules/x/index.js', '.git/HEAD']) check(existsSync(join(repo, kept)), `keeps ${kept}`);
  check(readFileSync(join(repo, 'index.html'), 'utf8') === 'new page', 'copies the new index.html');
  check(readFileSync(join(repo, 'src/logic.mjs'), 'utf8') === 'new logic', 'copies the new src/logic.mjs');
  check(existsSync(join(repo, 'docs/NOTES.md')) && existsSync(join(repo, 'art/stories/README.md')), 'copies new files in subfolders');
  check((statSync(join(repo, 'build.sh')).mode & 0o111) !== 0, 'keeps build.sh runnable');
  const status = run('git', ['status', '--porcelain'], repo);
  check(/CHANGES\.md/.test(status) && /index 2\.html/.test(status), 'git sees the removals, ready to commit');
} finally {
  rmSync(base, { recursive: true, force: true });
}

// The project itself never names a file with a space, since a space and a number is how the updater knows a copy.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const spaced = [];
const walk = (dir, rel) => {
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? `${rel}/${d.name}` : d.name;
    if (['.git', 'node_modules', 'dist', 'out'].includes(d.name)) continue;
    if (d.name.includes(' ')) spaced.push(r);
    if (d.isDirectory()) walk(join(dir, d.name), r);
  }
};
walk(ROOT, '');
check(spaced.length === 0, `no file name in the project has a space (found: ${spaced.slice(0, 5).join(', ')})`);
console.log(`${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
