// Signs one license code (2026-09-25). One code per child per school year, matching how the Texas accounts fund each child.
//   node tools/license-sign.mjs <private-key.json> <code id> "<child or family name>" <school year like 2026-27> <last day like 2027-07-31>
// Prints the code to send to the family after their order.
import { readFileSync } from 'node:fs';
import { makeLicenseCode } from '../src/logic.mjs';
const [keyPath, id, name, year, until] = process.argv.slice(2);
if (!keyPath || !id || !name || !year || !until) { console.error('Usage: node tools/license-sign.mjs <private-key.json> <id> "<name>" <year> <until>'); process.exit(1); }
const jwk = JSON.parse(readFileSync(keyPath, 'utf8'));
console.log(await makeLicenseCode(jwk, { id, name, year, until }));
