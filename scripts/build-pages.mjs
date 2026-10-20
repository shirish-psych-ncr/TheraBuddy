import { spawnSync } from 'node:child_process';
const base = process.env.AASHA_BASE ?? `/${(process.env.GITHUB_REPOSITORY || 'shirish-psych-ncr/TheraBuddy').split('/')[1]}/`;
if (!/^\/(?:[A-Za-z0-9._-]+\/)*$/.test(base)) throw new Error('AASHA_BASE must be / or a slash-delimited repository path.');
const env = { ...process.env, GITHUB_PAGES: 'true', AASHA_BASE: base };
for (const [script, args] of [['node_modules/typescript/bin/tsc', ['--noEmit']], ['node_modules/vite/bin/vite.js', ['build']]]) {
  const result = spawnSync(process.execPath, [script, ...args], { env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

await import('./check-pages.mjs');
