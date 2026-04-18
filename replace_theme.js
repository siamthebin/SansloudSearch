import fs from 'fs';

let content = fs.readFileSync('./src/App.tsx', 'utf8');

// Backgrounds
content = content.replace(/bg-\[\#121212\]/g, 'bg-transparent');
content = content.replace(/bg-black\/50/g, 'bg-white/20');
content = content.replace(/bg-black\/80/g, 'bg-black/40');
content = content.replace(/bg-\[\#1E1E1E\]/g, 'bg-white/40 backdrop-blur-xl');
content = content.replace(/bg-neutral-900/g, 'bg-white/50');
content = content.replace(/bg-neutral-800/g, 'bg-white/40');
content = content.replace(/bg-white\/5/g, 'bg-white/30');
content = content.replace(/bg-white\/10/g, 'bg-white/40');
content = content.replace(/bg-black/g, 'bg-white/80');

// Borders
content = content.replace(/border-white\/10/g, 'border-white/40');
content = content.replace(/border-white\/5/g, 'border-white/30');
content = content.replace(/border-neutral-800/g, 'border-white/50');

// Text colors
content = content.replace(/text-white/g, 'text-blue-950');
content = content.replace(/text-neutral-200/g, 'text-blue-900');
content = content.replace(/text-neutral-300/g, 'text-blue-800');
content = content.replace(/text-neutral-400/g, 'text-blue-700');
content = content.replace(/text-neutral-500/g, 'text-blue-600');
content = content.replace(/text-neutral-600/g, 'text-blue-500');

// Hover states
content = content.replace(/hover:bg-neutral-900/g, 'hover:bg-white/60');
content = content.replace(/hover:text-white/g, 'hover:text-blue-950');
content = content.replace(/group-hover:text-white/g, 'group-hover:text-blue-950');

// Specific elements
content = content.replace(/bg-white text-black/g, 'bg-blue-600 text-white');
content = content.replace(/text-orange-500/g, 'text-blue-600');

fs.writeFileSync('./src/App.tsx', content);
