import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const files = process.argv.slice(2);
if (!files.length) throw new Error('Pass verification script paths');
let failed = false;
for (const file of files) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'polad-verification-'));
  const database = path.join(directory, 'test.db');
  fs.copyFileSync('data/poladcharkhesh.db', database);
  const result = spawnSync(process.execPath, ['--import', 'tsx', file], {
    env: { ...process.env, NODE_ENV: 'test', DATABASE_PATH: database, POLAD_ISOLATED_TEST_DB: '1' }, encoding: 'utf8', timeout: 120000,
  });
  fs.mkdirSync('test-results', {recursive:true});
  fs.writeFileSync(path.join('test-results', path.basename(file) + '.log'), (result.stdout || '') + (result.stderr || ''));
  console.log(file + ': exit=' + result.status + (result.error ? ' error=' + result.error.message : ''));
  console.log((result.stdout || '').split('\n').slice(-8).join('\n'));
  if (result.status !== 0) { failed = true; console.error(result.stderr); }
}
process.exitCode = failed ? 1 : 0;
