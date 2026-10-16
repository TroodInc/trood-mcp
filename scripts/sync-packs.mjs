// Copies the industry packs from the API (the one source of truth) into the MCP.
//   node scripts/sync-packs.mjs          writes src/packs.generated.ts
//   node scripts/sync-packs.mjs --check  exits 1 if the copy differs (npm run check runs it)
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, '..', '..', 'api', 'src', 'catalog', 'packs.ts');
const target = join(here, '..', 'src', 'packs.generated.ts');
const HEADER = '// Generated from api/src/catalog/packs.ts by mcp/scripts/sync-packs.mjs. Do not edit: change the API file and run the sync.\n';

export function expected() {
  return HEADER + readFileSync(source, 'utf8');
}

export function inSync() {
  try { return readFileSync(target, 'utf8') === expected(); } catch { return false; }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--check')) {
    if (!inSync()) { console.error('src/packs.generated.ts differs from api/src/catalog/packs.ts. Run: node scripts/sync-packs.mjs'); process.exit(1); }
    console.log('packs in sync');
  } else {
    writeFileSync(target, expected());
    console.log(`wrote ${target}`);
  }
}
