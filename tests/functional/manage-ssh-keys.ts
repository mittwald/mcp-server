#!/usr/bin/env tsx
/**
 * SSH Key Management Script
 * Lists current SSH keys and adds a new one
 */

import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const PUBLIC_KEY = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExample... developer@laptop';
const KEY_NAME = 'developer-laptop-key';

async function runMittwaldCli(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const proc = spawn('mw', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ stdout, stderr, code: code ?? 0 });
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  console.log('=== Mittwald SSH Key Management ===\n');

  // Step 1: List current SSH keys
  console.log('1. Listing current SSH keys...');
  try {
    const listResult = await runMittwaldCli(['user', 'ssh-key', 'list', '--output', 'json']);

    if (listResult.code === 0) {
      console.log('Current SSH keys:');
      const keys = JSON.parse(listResult.stdout);
      if (Array.isArray(keys) && keys.length > 0) {
        keys.forEach((key: any) => {
          console.log(`  - ID: ${key.id}`);
          console.log(`    Comment: ${key.comment || 'N/A'}`);
          console.log(`    Fingerprint: ${key.fingerprint || 'N/A'}`);
          console.log(`    Created: ${key.createdAt || 'N/A'}`);
          console.log('');
        });
      } else {
        console.log('  No SSH keys found.');
      }
    } else {
      console.error('Failed to list SSH keys:');
      console.error('STDOUT:', listResult.stdout);
      console.error('STDERR:', listResult.stderr);
    }
  } catch (error) {
    console.error('Error listing SSH keys:', error);
  }

  console.log('\n2. Adding new SSH key...');

  // Step 2: Create temporary file with the public key
  const sshDir = join(homedir(), '.ssh');
  const tempKeyPath = join(sshDir, `temp-${KEY_NAME}.pub`);

  try {
    console.log(`Creating temporary key file: ${tempKeyPath}`);
    writeFileSync(tempKeyPath, PUBLIC_KEY);

    // Step 3: Import the SSH key
    console.log('Importing SSH key...');
    const importResult = await runMittwaldCli([
      'user',
      'ssh-key',
      'import',
      '--input',
      `temp-${KEY_NAME}.pub`,
      '--quiet'
    ]);

    if (importResult.code === 0) {
      console.log('SSH key imported successfully!');
      console.log('Key ID:', importResult.stdout.trim());
    } else {
      console.error('Failed to import SSH key:');
      console.error('STDOUT:', importResult.stdout);
      console.error('STDERR:', importResult.stderr);
    }

    // Clean up temporary file
    console.log('Cleaning up temporary file...');
    unlinkSync(tempKeyPath);

  } catch (error) {
    console.error('Error importing SSH key:', error);
    // Try to clean up even if there was an error
    try {
      unlinkSync(tempKeyPath);
    } catch {}
  }

  // Step 4: List SSH keys again to verify
  console.log('\n3. Listing SSH keys after import...');
  try {
    const finalListResult = await runMittwaldCli(['user', 'ssh-key', 'list', '--output', 'json']);

    if (finalListResult.code === 0) {
      const keys = JSON.parse(finalListResult.stdout);
      console.log(`Total SSH keys: ${keys.length}`);
      if (Array.isArray(keys) && keys.length > 0) {
        keys.forEach((key: any) => {
          console.log(`  - ${key.comment || key.id}: ${key.fingerprint || 'N/A'}`);
        });
      }
    }
  } catch (error) {
    console.error('Error listing SSH keys:', error);
  }

  console.log('\n=== Done ===');
}

main().catch(console.error);
