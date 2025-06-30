import { beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';

// Load environment variables for tests
dotenv.config();

// Global setup
beforeAll(() => {
  console.log('🧪 Starting test suite...');
});

afterAll(() => {
  console.log('✅ Test suite completed');
});