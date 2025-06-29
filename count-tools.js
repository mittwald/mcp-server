#!/usr/bin/env node

// Import the tools directly from the built version
import { TOOLS } from './build/constants/tools.js';

console.log('🔢 Tool Count Analysis');
console.log('========================');
console.log(`Current tools loaded: ${TOOLS.length}`);

// Group by category
const categories = {};
TOOLS.forEach(tool => {
  const parts = tool.name.split('_');
  if (parts.length >= 2) {
    const category = parts[1] || 'other';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(tool.name);
  } else {
    if (!categories['other']) {
      categories['other'] = [];
    }
    categories['other'].push(tool.name);
  }
});

console.log('\n📊 Tools by Category:');
Object.keys(categories).sort().forEach(category => {
  console.log(`  ${category}: ${categories[category].length} tools`);
});

console.log('\n📋 Tool Names:');
TOOLS.forEach((tool, index) => {
  console.log(`${index + 1}. ${tool.name}`);
});