import { spawn } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const outDir = resolve(repoRoot, '.test-dist');
const testEntries = [
  'tests/education.lessons.test.ts',
  'tests/v3.server.test.ts',
  'tests/v3.http.test.ts',
  'tests/market.snapshots.test.ts',
];
const outputFiles = testEntries.map((entry) => {
  const filename = entry.split('/').pop()?.replace(/\.ts$/, '.js');

  if (!filename) {
    throw new Error(`Unable to resolve output filename for ${entry}`);
  }

  return resolve(outDir, filename);
});

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

await build({
  absWorkingDir: repoRoot,
  entryPoints: testEntries,
  outdir: outDir,
  outbase: 'tests',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node18',
  sourcemap: false,
  packages: 'external',
  tsconfig: resolve(repoRoot, 'tsconfig.json'),
  logLevel: 'silent',
});

const exitCode = await new Promise((resolvePromise, rejectPromise) => {
  const child = spawn(process.execPath, ['--test', ...outputFiles], {
    cwd: repoRoot,
    stdio: 'inherit',
  });

  child.on('error', rejectPromise);
  child.on('exit', (code) => resolvePromise(code ?? 1));
});

process.exit(exitCode);
