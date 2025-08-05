import { beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test-specific environment variables
process.env.NODE_ENV = 'test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-oauth-tests';
process.env.OAUTH_ISSUER = process.env.OAUTH_ISSUER || 'http://localhost:8080/default';
process.env.DISABLE_OAUTH = 'false';

// Global test setup
beforeAll(async () => {
  console.log('🧪 Setting up OAuth test environment...');
  console.log(`📡 OAuth Issuer: ${process.env.OAUTH_ISSUER}`);
  console.log(`🔴 Redis URL: ${process.env.REDIS_URL}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? '[SET]' : '[NOT SET]'}`);
});

// Global test cleanup
afterAll(async () => {
  console.log('🧹 Cleaning up OAuth test environment...');
});