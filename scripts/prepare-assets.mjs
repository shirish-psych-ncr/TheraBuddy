import sharp from 'sharp';
import fs from 'node:fs';
fs.mkdirSync('public', { recursive: true });
await sharp('logo.png').resize(100, 100, { fit: 'contain', background: '#ffffff' }).png().toFile('public/logo.png');
for (const size of [192, 512]) await sharp('logo.png').resize(size,size,{ fit: 'contain', background: '#ffffff' }).png().toFile(`public/icon-${size}.png`);
await sharp('logo.png').resize(180,180,{ fit: 'contain', background: '#ffffff' }).png().toFile('public/apple-touch-icon.png');
await sharp('logo.png').resize(330,330,{ fit: 'contain', background: '#ffffff' }).extend({top:91,bottom:91,left:91,right:91,background:'#ffffff'}).png().toFile('public/icon-maskable.png');
