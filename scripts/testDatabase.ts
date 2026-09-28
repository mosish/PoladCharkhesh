// This import MUST precede imports of server/config or any database module.
// Direct invocation of a mutating verification script must also be isolated.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const canonical = path.resolve('data/poladcharkhesh.db');
if (process.env.DATABASE_PATH && path.resolve(process.env.DATABASE_PATH) === canonical) {
  throw new Error('Verification may not use the canonical database');
}
if (process.env.POLAD_ISOLATED_TEST_DB !== '1') {
  const source = process.env.DATABASE_PATH || canonical;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'polad-verification-'));
  process.env.DATABASE_PATH = path.join(dir, 'test.db');
  fs.copyFileSync(source, process.env.DATABASE_PATH);
}
process.env.NODE_ENV = 'test';
