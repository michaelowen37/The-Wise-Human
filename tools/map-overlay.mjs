// The Wise Human. Copyright (c) 2026. Source-available; not for reuse. See LICENSE.md.
// Draws a map's hit regions over its painting so they can be traced to match it (2026-09-23): writes an SVG with the
// painting (art/maps/<serial>.webp) behind the polygons, each labelled. Run: node tools/map-overlay.mjs <map id> > /tmp/map.svg
import { MAPS } from '../src/logic.mjs';
const id = process.argv[2]; const m = MAPS[id]; if (!m) { console.error('maps: ' + Object.keys(MAPS).join(', ')); process.exit(1); }
const [bx, by, bw, bh] = m.box;
const out = [`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${bx} ${by} ${bw} ${bh}" width="${bw * 10}" height="${bh * 10}">`, `<image xlink:href="../art/maps/${m.art}.webp" href="../art/maps/${m.art}.webp" x="${bx}" y="${by}" width="${bw}" height="${bh}" preserveAspectRatio="none"/>`];
for (const r of m.regions) for (const pts of (r.parts || [r.points])) { const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length; const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length; out.push(`<polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="rgba(94,154,98,0.25)" stroke="#2E2E2E" stroke-width="0.4"/><text x="${cx}" y="${cy}" font-size="2.4" text-anchor="middle" font-family="sans-serif">${r.name}</text>`); }
out.push('</svg>'); console.log(out.join('\n'));
