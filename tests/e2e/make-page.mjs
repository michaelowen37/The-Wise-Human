// Builds tests/e2e/page.html: the real built artifact running in a real browser.
// React is loaded from the machine's node_modules with a tiny require() shim
// (React 19 ships no browser bundle), and window.storage is a fake in-memory
// version of the artifact host's storage API.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const G = execSync('npm root -g').toString().trim();
const req = createRequire(import.meta.url);
const read = (rel) => readFileSync(`${G}/${rel}`, 'utf8');
const mods = {
  react: read('react/cjs/react.production.js'),
  'react-dom': read('react-dom/cjs/react-dom.production.js'),
  'react-dom/client': read('react-dom/cjs/react-dom-client.production.js'),
  scheduler: read('react-dom/node_modules/scheduler/cjs/scheduler.production.js'),
};
// Transpile the artifact's JSX + imports to plain CommonJS with TypeScript.
execSync('tsc --allowJs --jsx react --target es2020 --module commonjs --outDir tests/e2e/out dist/edusphere-prototype.jsx', { stdio: 'ignore' });
mods.app = readFileSync('tests/e2e/out/edusphere-prototype.js', 'utf8');

const wrap = (name, code) => `__def(${JSON.stringify(name)}, function(module, exports, require){${code}\n});`;
const html = `<!doctype html><html><head><meta charset="utf-8"><title>EduSphere e2e</title></head><body><div id="root"></div>
<script>
var process = { env: { NODE_ENV: 'production' } };
var __mods = {}, __cache = {};
function __def(n, f) { __mods[n] = f; }
function require(n) { if (__cache[n]) return __cache[n].exports; var m = { exports: {} }; __cache[n] = m; __mods[n](m, m.exports, require); return m.exports; }
// Fake storage with the host's documented behavior: get throws on a missing key. Since pass GV it keeps its keys in
// localStorage, the way the real index.html shim does, so a page reload keeps the student's record and the tests can
// prove a refresh brings the student back to their screen. Each test run opens a fresh browser context, so nothing
// carries between runs.
window.storage = {
  get: async function (k) { var v = localStorage.getItem('fake:' + k); if (v === null) throw new Error('not found'); return { key: k, value: v, shared: false }; },
  set: async function (k, v) { localStorage.setItem('fake:' + k, v); return { key: k, value: v, shared: false }; },
  delete: async function (k) { localStorage.removeItem('fake:' + k); return { key: k, deleted: true, shared: false }; },
  list: async function (p) { var keys = []; for (var i = 0; i < localStorage.length; i++) { var key = localStorage.key(i); if (key.indexOf('fake:' + (p || '')) === 0) keys.push(key.slice(5)); } return { keys: keys, prefix: p, shared: false }; },
};
window.__spoken = [];
Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { cancel: function(){}, getVoices: function(){ return []; }, speak: function (u) { window.__spoken.push(u.text); (window.__rates = window.__rates || []).push(u.rate); setTimeout(function () { if (u.onend) u.onend({}); }, 30); } } });
Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: function (t) { this.text = t; } });
</script>
<script>${Object.entries(mods).map(([n, c]) => wrap(n, c)).join('\n')}</script>
<script>
var React = require('react'); var App = require('app').default;
require('react-dom/client').createRoot(document.getElementById('root')).render(React.createElement(App));
</script></body></html>`;
writeFileSync('tests/e2e/page.html', html);
// The same page with licensing on, for tests/e2e/license.mjs.
writeFileSync('tests/e2e/page-licensed.html', html.replace('<script>\nvar process', '<script>\nwindow.__eduLicensing = true;\nvar process'));
console.log('page.html written (' + Math.round(html.length / 1024) + ' KB)');
