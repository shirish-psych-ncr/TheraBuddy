import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { cwd, exit } from 'node:process';

const root = cwd();
const ignoredDirs = new Set(['node_modules', '.git', '.wrangler', 'dist', 'output', '.playwright-cli']);
const duplicateFiles = [];
const trackedRiskFiles = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else {
      if (/ \(1\)(\.|$)/.test(entry.name) && /\.(md|mjs|ts|tsx|css|json|jsonc|html|sql)$/i.test(entry.name)) duplicateFiles.push(relative(root, path));
      if (/\.(env|pem|key|db|sqlite)$/i.test(entry.name)) trackedRiskFiles.push(relative(root, path));
    }
  }
}

walk(root);
const failures = [];
if (duplicateFiles.length) failures.push(`duplicate source-like files remain: ${duplicateFiles.join(', ')}`);
if (trackedRiskFiles.length) failures.push(`sensitive/local files are present: ${trackedRiskFiles.join(', ')}`);
// Reject committed sync-relay secrets. The placeholder KV id is allowed to
// remain — the relay is an optional component and CI must not depend on it.
const relayPath = join(root, 'wrangler.relay.jsonc');
if (existsSync(relayPath)) {
  const relayConfig = readFileSync(relayPath, 'utf8');
  if (/^\s*(SYNC_KEY|sync_key)\s*=\s*"[^"]+"/im.test(relayConfig)) {
    failures.push('wrangler.relay.jsonc must never contain the sync secret inline; use `wrangler secret put SYNC_KEY`');
  }
}
for (const required of ['README.md', 'AGENTS.md', 'docs/10-handoff.md', 'src/App.tsx', 'worker/index.ts']) {
  if (!existsSync(join(root, required))) failures.push(`required file is missing: ${required}`);
}
if (failures.length) {
  console.error(`Repository audit failed:\n- ${failures.join('\n- ')}`);
  exit(1);
}
console.log('Repository audit passed: no duplicate source files, local secret/database files, or missing core files.');
