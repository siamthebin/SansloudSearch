import fs from 'fs';

let content = fs.readFileSync('./src/App.tsx', 'utf8');

// Replace background classes to deep variants
content = content.replace(/bg-white\/[0-9]+/g, 'bg-[#011e38]/50 backdrop-blur-3xl');
content = content.replace(/bg-white/g, 'bg-brand-blue');

// Text colors
content = content.replace(/text-blue-950/g, 'text-white');
content = content.replace(/text-blue-900/g, 'text-brand-light');
content = content.replace(/text-blue-800\/[0-9]+/g, 'text-brand-light/90');
content = content.replace(/text-blue-800/g, 'text-brand-light/90');
content = content.replace(/text-blue-700\/[0-9]+/g, 'text-brand-light/70');
content = content.replace(/text-blue-700/g, 'text-brand-light/70');
content = content.replace(/text-blue-600/g, 'text-brand-cyan');
content = content.replace(/text-blue-500/g, 'text-brand-cyan');
content = content.replace(/text-sky-600/g, 'text-brand-blue');
content = content.replace(/text-sky-500/g, 'text-brand-blue');
content = content.replace(/text-sky-700/g, 'text-brand-cyan');
content = content.replace(/text-black/g, 'text-brand-dark');

// Shadows
content = content.replace(/shadow-blue-[0-9]+\/?[0-9]*/g, 'shadow-black/30');
content = content.replace(/shadow-sky-[0-9]+\/?[0-9]*/g, 'shadow-brand-blue/20');
content = content.replace(/shadow-blue-100\/[0-9]+/g, 'shadow-black/30');

// Borders
content = content.replace(/border-white\/[0-9]+/g, 'border-brand-cyan/20');
content = content.replace(/border-b-sky-400/g, 'border-b-brand-blue');
content = content.replace(/border-t-sky-400/g, 'border-t-brand-blue');

// Special corrections
content = content.replace(/bg-brand-blue flex items-center justify-center text-brand-dark/g, 'bg-brand-blue flex items-center justify-center text-white');

fs.writeFileSync('./src/App.tsx', content);
