import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const manifest = JSON.parse(readFileSync('dist/manifest.webmanifest', 'utf8'));
const base = manifest.scope;
assert.equal(manifest.start_url, base);
assert.equal(manifest.id, base);
assert.ok(existsSync('dist/.nojekyll'));
for (const file of ['index.html', 'staff.html']) {
  const html = readFileSync(`dist/${file}`, 'utf8');
  for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^(https?:|#)/.test(url)) continue;
    assert.ok(url.startsWith(base), `${file}: URL outside deployment base: ${url}`);
    assert.ok(existsSync('dist/' + url.slice(base.length)), `${file}: missing ${url}`);
  }
}
for (const icon of manifest.icons) assert.ok(existsSync('dist/' + icon.src.slice(base.length)));
const sw = readFileSync('dist/sw.js', 'utf8');
assert.ok(!/url\s*:\s*["'][^"']*staff\.html/.test(sw), 'Staff HTML must not be precached');
assert.ok(sw.includes('denylist:') && sw.includes('staff(?:') && sw.includes('api(?:'), 'Navigation exclusions must be present');
console.log(`PASS: static HTML links, assets, manifest and service-worker exclusions at ${base}`);
