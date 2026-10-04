// Builds index.html: the whole product as ONE file that runs anywhere a browser runs.
// GitHub Pages, a school's own web server, a USB stick, or double-clicked from a folder.
//
// What goes in:
// - React, bundled in, so nothing is fetched from anywhere and locked-down devices work.
// - The app, compiled from dist/edusphere-prototype.jsx to plain JavaScript.
// - A storage layer on the browser's own localStorage, with the same contract the
//   artifact host uses, so the app code is identical in both places.
//
// Nothing here talks to a server. The file is the product.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { newestNews, recentNews } from './whats-new.mjs';

const G = execSync('npm root -g').toString().trim();
const read = (rel) => readFileSync(`${G}/${rel}`, 'utf8');
const mods = {
  react: read('react/cjs/react.production.js'),
  'react-dom': read('react-dom/cjs/react-dom.production.js'),
  'react-dom/client': read('react-dom/cjs/react-dom-client.production.js'),
  scheduler: read('react-dom/node_modules/scheduler/cjs/scheduler.production.js'),
};
execSync('tsc --allowJs --jsx react --target es2020 --module commonjs --outDir tests/e2e/out dist/edusphere-prototype.jsx', { stdio: 'ignore' });
mods.app = readFileSync('tests/e2e/out/edusphere-prototype.js', 'utf8');

// The logo as the browser-tab icon. Built from the same drawing the app uses, squeezed
// into a data address so the page still needs no other file.
// The Wise Human's tab icon (2026-09-25): a gold ring with its gold planet around a bold ivory W on the night green,
// filling the whole square so it reads at 16 pixels. The full logo's fine words would vanish that small. This bold version
// keeps the idea (a green sphere with a gold arc) at a size a tab can show.
const iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#14231E"/><circle cx="32" cy="32" r="23" fill="none" stroke="#D9A441" stroke-width="4.5"/><path d="M17.5 23 L24.5 42.5 L32 28.5 L39.5 42.5 L46.5 23" fill="none" stroke="#F1EDE3" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="51" cy="44" r="5" fill="#D9A441" stroke="#14231E" stroke-width="2"/></svg>';
const favicon = 'data:image/svg+xml,' + encodeURIComponent(iconSvg);
// The story pictures that exist, so the page shows a placeholder for the rest without asking the server.
// The newest block of docs/WHATS-NEW.md becomes the one-time pop-up educators see after an update. tools/whats-new.mjs
// picks it (the latest date, the higher block on a tie) and tests/site.test.mjs checks the page shows that very block.
const newsDoc = existsSync('docs/WHATS-NEW.md') ? readFileSync('docs/WHATS-NEW.md', 'utf8') : '';
const news = newestNews(newsDoc);
if (news) news.history = recentNews(newsDoc, 6); // the last six updates in full, for the More Details page (pass HL)
const artList = existsSync('art/stories') ? readdirSync('art/stories').filter((f) => f.endsWith('.webp')).map((f) => f.slice(0, -5)) : [];
const audioList = existsSync('audio') ? readdirSync('audio').filter((f) => f.endsWith('.mp3')).map((f) => f.slice(0, -4)) : [];
const coloringList = existsSync('art/coloring') ? readdirSync('art/coloring').filter((f) => f.endsWith('.webp')).map((f) => f.slice(0, -5)) : [];
const mapList = existsSync('art/maps') ? readdirSync('art/maps').filter((f) => f.endsWith('.webp')).map((f) => f.slice(0, -5)) : [];

const wrap = (name, code) => `__def(${JSON.stringify(name)}, function(module, exports, require){${code}\n});`;
const html = `<!doctype html>
<!-- The Wise Human. Copyright (c) 2026 iECHO, LLC. All rights reserved. Source-available, not open source: reading is allowed, reuse is not. See LICENSE.md. -->
<html lang="en">
<head>
<meta charset="utf-8">
<!-- Content Security Policy (security pass, 2026-09-25): the page may load and talk only to its own site, so nothing
     a student types can leave the device from inside the app, and no outside script, plugin or form can be slipped in.
     The Claude preview copy drops this line, since the preview host frames the page with rules of its own. -->
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' data: blob:; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="The Wise Human: mastery-based learning from pre-K to college, with nothing leaving the device.">
<title>The Wise Human</title>
<link rel="icon" type="image/svg+xml" href="${favicon}">
<link rel="apple-touch-icon" href="icons/icon-180.png">
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#2F5D4F">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="The Wise Human">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<style>html, body { margin: 0; padding: 0; background: #F5F7F1; }
/* Until the app has loaded, the logo draws itself forward and back. It sits after #root and shows only while #root is empty. */
#edu-boot { display: none; }
#root:empty + #edu-boot { display: flex; justify-content: center; padding: 90px 24px; }
.edu-boot-word { display: flex; gap: 2px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 34px; font-weight: 800; color: #2F5D4F; letter-spacing: 1px; }
.edu-boot-word span { display: inline-block; animation: edu-bob 1.2s ease-in-out infinite; }
.edu-boot-word .edu-boot-dots { color: #C9A227; }
@keyframes edu-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@media (prefers-reduced-motion: reduce) { .edu-boot-word span { animation: none; } }
</style>
</head>
<body>
<div id="root"></div>
<div id="edu-boot" aria-hidden="true"><div class="edu-boot-word">${'Loading'.split('').map((ch, i) => `<span style="animation-delay:${(i * 0.12).toFixed(2)}s">${ch}</span>`).join('')}<span class="edu-boot-dots" style="animation-delay:0.9s">...</span></div></div>
<script>
window.__eduArt = ${JSON.stringify(artList)};
window.__eduColoringArt = ${JSON.stringify(coloringList)};
window.__eduMapArt = ${JSON.stringify(mapList)};
window.__eduAudio = ${JSON.stringify(audioList)};
window.__eduNews = ${JSON.stringify(news)};
// Installable app: the worker keeps a copy of the page for offline use and asks the network first, so a fresh build always wins.
if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) { navigator.serviceWorker.register('sw.js').catch(function () {}); }
var process = { env: { NODE_ENV: 'production' } };
var __mods = {}, __cache = {};
function __def(n, f) { __mods[n] = f; }
function require(n) { if (__cache[n]) return __cache[n].exports; var m = { exports: {} }; __cache[n] = m; __mods[n](m, m.exports, require); return m.exports; }
// Storage on the browser's own localStorage, with the contract the app expects:
// get throws when a key is missing, set and delete return what they did, list filters by prefix.
// Everything a student does lives here, on this device, and nowhere else.
window.storage = {
  get: async function (k) { var v = localStorage.getItem(k); if (v === null) throw new Error('not found'); return { key: k, value: v, shared: false }; },
  set: async function (k, v) { localStorage.setItem(k, v); return { key: k, value: v, shared: false }; },
  delete: async function (k) { localStorage.removeItem(k); return { key: k, deleted: true, shared: false }; },
  list: async function (p) { var keys = []; for (var i = 0; i < localStorage.length; i++) { var key = localStorage.key(i); if (key.indexOf(p || '') === 0) keys.push(key); } return { keys: keys, prefix: p, shared: false }; },
};
</script>
<script>${Object.entries(mods).map(([n, c]) => wrap(n, c)).join('\n')}</script>
<script>
var React = require('react'); var App = require('app').default;
require('react-dom/client').createRoot(document.getElementById('root')).render(React.createElement(App));
</script>
</body>
</html>`;
writeFileSync('index.html', html);
// The service worker, stamped with this build so an old copy is thrown away on the first visit after a deploy.
const stamp = String(Date.now()); // one cache per build; the page itself carries the readable stamp
writeFileSync('sw.js', `// Generated by tools/build-site.mjs. Never edit by hand.
const CACHE = 'edusphere-' + ${JSON.stringify(stamp)}.replace(/[^A-Za-z0-9]+/g, '-');
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-512-maskable.png', './icons/icon-180.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin || e.request.method !== 'GET') return;
  const isPage = e.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
  const keep = (res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res; };
  if (isPage) { e.respondWith(fetch(e.request).then(keep).catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))); return; }
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then(keep)));
});
`);
writeFileSync('dist/index.html', html);
console.log('index.html written (' + Math.round(html.length / 1024) + ' KB)');
