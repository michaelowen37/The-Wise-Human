// Smoke test: does the built artifact load and render its first screen without throwing?
// (Runs in Node with react-dom/server. Taps/effects are not exercised here.)
import { renderToString } from 'react-dom/server';
import React from 'react';
const mod = await import('../dist/edusphere-prototype.jsx');
const App = mod.default;
const html = renderToString(React.createElement(App));
if (!html.includes('Loading')) { console.error('FAIL - first screen did not render. Got:', html.slice(0, 200)); process.exit(1); }
// A component that renders itself produces an enormous first screen and hangs the browser.
// This caught exactly that once, so the ceiling stays.
// The loading screen draws the logo (about 300 strokes), so a healthy first screen is near 60,000 characters; a runaway render is far past this.
if (html.length > 150000) { console.error('FAIL - first screen is', html.length, 'characters. Something is repeating itself.'); process.exit(1); }
console.log('PASS - artifact loads and renders its first screen (' + html.length + ' chars of HTML)');
