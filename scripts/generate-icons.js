#!/usr/bin/env node

// Simple script to generate PWA icons
// Run with: node scripts/generate-icons.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create simple colored squares as placeholder icons
// In production, you would use a proper icon generation tool

const sizes = [
  { name: 'pwa-64x64.png', size: 64 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'maskable-icon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 }
];

// Create a simple SVG template that can be used
const createSvgIcon = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="#1976d2"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" 
        fill="white" font-family="Arial, sans-serif" 
        font-size="${size * 0.2}px" font-weight="bold">
    HSA
  </text>
  <text x="50%" y="65%" text-anchor="middle" dy=".3em" 
        fill="white" font-family="Arial, sans-serif" 
        font-size="${size * 0.1}px">
    Songbook
  </text>
</svg>`;
};

// Generate SVG files as placeholders
sizes.forEach(({ name, size }) => {
  const svgContent = createSvgIcon(size);
  const svgName = name.replace('.png', '.svg');
  const filePath = path.join(__dirname, '..', 'public', svgName);
  
  fs.writeFileSync(filePath, svgContent);
  console.log(`Created ${svgName} (${size}x${size})`);
});

console.log('\nNote: These are SVG placeholders. For production, convert to PNG using:');
console.log('- An online converter like https://cloudconvert.com/svg-to-png');
console.log('- ImageMagick: convert icon.svg icon.png');
console.log('- Or use the @vite-pwa/assets-generator package');