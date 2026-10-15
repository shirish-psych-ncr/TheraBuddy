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
const hashes = {
  'Early Intervention Tracking App.txt': 'FC69AC3B153FC51063E07FAC049C533603CFB8D13512B8C9FB591DDF728BCF65',
  'logo.png': '62F6AF2C422FB788FCE8AE4B9511B8061932FF6FB1F5EADBE74FC59B6FC73A33'
};
for (const [name,expected] of Object.entries(hashes)) {
  const actual = createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex').toUpperCase();
  if (actual!==expected) failures.push(`${name}: original asset changed; review provenance before updating baseline`);
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`PASS: ${files.length} Markdown files, ${links} local links, both original source hashes intact.`);
