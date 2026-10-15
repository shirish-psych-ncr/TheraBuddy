import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = ['README.md','AGENTS.md',...fs.readdirSync(path.join(root,'docs')).filter(n=>n.endsWith('.md')).map(n=>'docs/'+n)];
const failures = [];
let links = 0;
for (const name of files) {
  const body = fs.readFileSync(path.join(root,name),'utf8');
  if (!body.startsWith('# ')) failures.push(`${name}: missing title`);
  for (const match of body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    let target = match[1];
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    target = decodeURIComponent(target.split('#')[0]);
    if (!fs.existsSync(path.resolve(root,path.dirname(name),target))) failures.push(`${name}: missing target ${target}`);
    links++;
  }
}
// Single source of truth for provenance baselines: derived from docs/12-evidence.md
// so the evidence register and this check can never drift apart again.
const evidence = fs.readFileSync(path.join(root,'docs/12-evidence.md'),'utf8');
const hashPattern = /\|\s*([^\s|][^|]*?)\s*\|\s*(?:Current workspace hash[^:]*:\s*)?([0-9A-F]{64})/g;
const baselines = new Map();
for (const m of evidence.matchAll(hashPattern)) baselines.set(m[1].trim(), m[2]);
if (!baselines.size) failures.push('docs/12-evidence.md: no SHA-256 baselines found to verify against');
for (const [name,expected] of baselines) {
  const file = path.join(root,name);
  if (!fs.existsSync(file)) { failures.push(`${name}: tracked asset is missing`); continue; }
  const actual = createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
  if (actual!==expected) failures.push(`${name}: original asset changed; review provenance before updating the baseline in docs/12-evidence.md`);
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`PASS: ${files.length} Markdown files, ${links} local links, tracked brief/logo provenance hashes match the current workspace.`);
