import fs from 'fs';

let content = fs.readFileSync('./src/App.tsx', 'utf8');
content = content.replace(/bg-\[\#101828\]\/50/g, 'bg-white/20');
content = content.replace(/hover:bg-\[\#101828\]/g, 'hover:bg-white/30');
fs.writeFileSync('./src/App.tsx', content);
