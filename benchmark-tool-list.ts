#!/usr/bin/env tsx
/**
 * Benchmark the tool list operation to see if directory scanning is slow
 */

import { performance } from 'perf_hooks';
import { initializeTools } from './src/constants/tools.js';
import { handleListTools } from './src/handlers/tool-handlers.js';

async function benchmarkToolList() {
  console.log('=== Tool List Benchmark ===\n');

  // Benchmark 1: Initial tool loading (includes directory scan)
  console.log('1. Initial tool loading (with directory scan)...');
  const start1 = performance.now();
  await initializeTools();
  const end1 = performance.now();
  console.log(`   Duration: ${(end1 - start1).toFixed(2)}ms\n`);

  // Benchmark 2: handleListTools (should use cache)
  console.log('2. First handleListTools call...');
  const start2 = performance.now();
  const result1 = await handleListTools({} as any);
  const end2 = performance.now();
  console.log(`   Duration: ${(end2 - start2).toFixed(2)}ms`);
  console.log(`   Tools returned: ${result1.tools.length}\n`);

  // Benchmark 3: Second handleListTools call (should be cached)
  console.log('3. Second handleListTools call (cached)...');
  const start3 = performance.now();
  const result2 = await handleListTools({} as any);
  const end3 = performance.now();
  console.log(`   Duration: ${(end3 - start3).toFixed(2)}ms`);
  console.log(`   Tools returned: ${result2.tools.length}\n`);

  // Benchmark 4: Run 10 times to get average
  console.log('4. Running handleListTools 10 times...');
  const iterations = 10;
  const durations: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await handleListTools({} as any);
    const end = performance.now();
    durations.push(end - start);
  }

  const avg = durations.reduce((a, b) => a + b, 0) / iterations;
  const min = Math.min(...durations);
  const max = Math.max(...durations);

  console.log(`   Average: ${avg.toFixed(2)}ms`);
  console.log(`   Min: ${min.toFixed(2)}ms`);
  console.log(`   Max: ${max.toFixed(2)}ms\n`);

  console.log('=== Benchmark Complete ===');
}

benchmarkToolList().catch(console.error);
