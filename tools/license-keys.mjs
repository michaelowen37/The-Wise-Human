// Makes a license key pair for The Wise Human (2026-09-25, docs/TEFA-PLAN.md). Run it once, on your own computer:
//   node tools/license-keys.mjs /path/outside/the/repo/wise-human-license-private.json
// The private key is written to that path: keep it in a password manager and never commit it. The public key is
// printed: send it to be pasted into LICENSE_PUBLIC_KEY in src/logic.mjs. Codes signed with the private key open in any
// copy of the app that carries the matching public key; nothing else can make a code the app accepts.
import { writeFileSync } from 'node:fs';
const out = process.argv[2];
if (!out) { console.error('Give a path outside the repository for the private key.'); process.exit(1); }
const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const priv = await crypto.subtle.exportKey('jwk', pair.privateKey); const pub = await crypto.subtle.exportKey('jwk', pair.publicKey);
writeFileSync(out, JSON.stringify(priv, null, 2), { mode: 0o600 });
console.log('Private key written to', out, '(keep it secret, never commit it).');
console.log('Public key for LICENSE_PUBLIC_KEY:', JSON.stringify({ kty: pub.kty, crv: pub.crv, x: pub.x, y: pub.y }));
