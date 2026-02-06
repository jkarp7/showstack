// Script to convert RGB gel colors to hex format
const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvPath = path.join(__dirname, '../docs/Gel Color RGB values.csv');
const gelData = fs.readFileSync(csvPath, 'utf8');

// Convert RGB to hex
function rgbToHex(r, g, b) {
  const toHex = (n) => {
    const hex = Math.round(n).toString(16).padStart(2, '0');
    return hex.toUpperCase();
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Parse CSV and convert to gel color object
const lines = gelData.trim().split('\n');
const gelColors = {};

// Skip header row and BOM
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].replace(/^\uFEFF/, ''); // Remove BOM if present
  const parts = line.split(',');
  if (parts.length < 7) continue;

  const manufacturer = parts[0];
  const number = parts[2]; // Column C (index 2)
  const r = parseInt(parts[4]); // Column E (RED)
  const g = parseInt(parts[5]); // Column F (GREEN)
  const b = parseInt(parts[6]); // Column G (BLUE)

  // Skip invalid or "no gel" entries
  if (number === '-' || !number || isNaN(r) || isNaN(g) || isNaN(b)) continue;

  const hex = rgbToHex(r, g, b);

  // Create gel code based on manufacturer
  let gelCode;
  if (manufacturer === 'Rosco') {
    gelCode = 'R' + number;
  } else if (manufacturer === 'LEE') {
    gelCode = 'L' + number;
  } else if (manufacturer === 'GAMCOLOR') {
    gelCode = 'G' + number;
  }

  if (gelCode) {
    gelColors[gelCode] = hex;
  }
}

// Output as TypeScript object
console.log('const gelColors: Record<string, string> = {');

// Sort by manufacturer and number
const sortedKeys = Object.keys(gelColors).sort((a, b) => {
  // Extract manufacturer prefix
  const aPrefix = a.match(/^[A-Z]+/)[0];
  const bPrefix = b.match(/^[A-Z]+/)[0];

  // Sort order: G (GAM), L (LEE), R (Rosco)
  const prefixOrder = { G: 0, L: 1, R: 2 };
  const aOrder = prefixOrder[aPrefix] || 3;
  const bOrder = prefixOrder[bPrefix] || 3;

  if (aOrder !== bOrder) return aOrder - bOrder;

  // Extract number
  const aNum = parseInt(a.match(/\d+/)[0]);
  const bNum = parseInt(b.match(/\d+/)[0]);

  return aNum - bNum;
});

// Group by manufacturer for output
const manufacturers = {
  G: { name: 'GAM (G prefix)', colors: [] },
  L: { name: 'LEE Filters (L prefix)', colors: [] },
  R: { name: 'Roscolux (R prefix)', colors: [] },
};

sortedKeys.forEach((key) => {
  const prefix = key.match(/^[A-Z]+/)[0];
  if (manufacturers[prefix]) {
    manufacturers[prefix].colors.push(key);
  }
});

// Output by manufacturer
let isFirst = true;
Object.entries(manufacturers).forEach(([prefix, data]) => {
  if (data.colors.length === 0) return;

  if (!isFirst) console.log('');
  console.log(`    // ${data.name}`);

  const colors = data.colors;
  for (let i = 0; i < colors.length; i += 4) {
    const batch = colors.slice(i, i + 4);
    const line = batch
      .map((key, idx) => {
        const comma = i + idx < colors.length - 1 || prefix !== 'R' ? ',' : '';
        return `'${key}': '${gelColors[key]}'${comma}`;
      })
      .join(' ');
    console.log(`    ${line}`);
  }

  isFirst = false;
});

console.log('  };');
console.log(`\n// Total gels: ${sortedKeys.length}`);
console.log(`// GAM: ${manufacturers['G'].colors.length}`);
console.log(`// LEE: ${manufacturers['L'].colors.length}`);
console.log(`// Rosco: ${manufacturers['R'].colors.length}`);
