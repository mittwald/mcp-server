#!/usr/bin/env tsx
/**
 * Comprehensive Organization Access Review
 *
 * This script performs a complete audit of all organizations the user has access to,
 * including:
 * 1. List all accessible organizations
 * 2. For each organization:
 *    - Get detailed organization information
 *    - List all current members with their roles
 *    - List all pending invitations
 *
 * Output is formatted for easy review and auditing purposes.
 */

import { spawn } from 'child_process';

interface Organization {
  customerId: string;
  name: string;
  description?: string;
  createdAt?: string;
}

interface Membership {
  membershipId: string;
  userId?: string;
  email: string;
  role: string;
  joinedAt: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  status?: string;
}

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

async function listOrganizations(): Promise<Organization[]> {
  console.log('Fetching all organizations...\n');

  const result = await runMittwaldCli(['org', 'list', '--output', 'json']);

  if (result.code !== 0) {
    throw new Error(`Failed to list organizations: ${result.stderr}`);
  }

  const orgs = JSON.parse(result.stdout);
  if (!Array.isArray(orgs)) {
    throw new Error('Unexpected response format from org list');
  }

  return orgs;
}

async function getOrganizationDetails(orgId: string): Promise<any> {
  const result = await runMittwaldCli(['org', 'get', orgId, '--output', 'json']);

  if (result.code !== 0) {
    console.warn(`  Warning: Could not fetch details for organization ${orgId}: ${result.stderr}`);
    return null;
  }

  return JSON.parse(result.stdout);
}

async function listMembers(orgId: string): Promise<Membership[]> {
  const result = await runMittwaldCli([
    'org',
    'membership',
    'list',
    '--org-id',
    orgId,
    '--output',
    'json'
  ]);

  if (result.code !== 0) {
    console.warn(`  Warning: Could not fetch members for organization ${orgId}: ${result.stderr}`);
    return [];
  }

  const members = JSON.parse(result.stdout);
  if (!Array.isArray(members)) {
    return [];
  }

  return members;
}

async function listInvitations(orgId: string): Promise<Invitation[]> {
  const result = await runMittwaldCli([
    'org',
    'invite',
    'list',
    '--org-id',
    orgId,
    '--output',
    'json'
  ]);

  if (result.code !== 0) {
    // Some orgs may not have invite listing enabled
    console.warn(`  Warning: Could not fetch invitations for organization ${orgId}: ${result.stderr}`);
    return [];
  }

  try {
    const invitations = JSON.parse(result.stdout);
    if (!Array.isArray(invitations)) {
      return [];
    }
    return invitations;
  } catch {
    return [];
  }
}

function printSectionHeader(title: string) {
  const line = '='.repeat(80);
  console.log('\n' + line);
  console.log(title.toUpperCase().padStart((80 + title.length) / 2));
  console.log(line + '\n');
}

function printSubsectionHeader(title: string) {
  console.log('\n' + '-'.repeat(80));
  console.log(title);
  console.log('-'.repeat(80) + '\n');
}

async function main() {
  printSectionHeader('Comprehensive Organization Access Review');
  console.log(`Review Date: ${new Date().toISOString()}\n`);

  try {
    // Step 1: Get all organizations
    const organizations = await listOrganizations();

    if (organizations.length === 0) {
      console.log('No organizations found for this user.\n');
      return;
    }

    console.log(`Found ${organizations.length} organization(s)\n`);

    // Step 2: Process each organization
    for (let i = 0; i < organizations.length; i++) {
      const org = organizations[i];

      printSectionHeader(`Organization ${i + 1} of ${organizations.length}`);

      console.log('ORGANIZATION DETAILS:');
      console.log(`  Name:           ${org.name}`);
      console.log(`  Organization ID: ${org.customerId}`);

      // Get detailed information
      const details = await getOrganizationDetails(org.customerId);
      if (details) {
        if (details.description) {
          console.log(`  Description:    ${details.description}`);
        }
        if (details.createdAt) {
          console.log(`  Created:        ${details.createdAt}`);
        }
        if (details.owner) {
          console.log(`  Owner:          ${details.owner}`);
        }
        // Print any other relevant fields
        const skipFields = ['customerId', 'name', 'description', 'createdAt', 'owner'];
        Object.keys(details).forEach(key => {
          if (!skipFields.includes(key) && details[key] !== null && details[key] !== undefined) {
            console.log(`  ${key.padEnd(14)}: ${JSON.stringify(details[key])}`);
          }
        });
      }

      // Get members
      printSubsectionHeader('Current Members');
      const members = await listMembers(org.customerId);

      if (members.length === 0) {
        console.log('  No members found (or access denied)\n');
      } else {
        console.log(`  Total Members: ${members.length}\n`);

        members.forEach((member, idx) => {
          console.log(`  Member ${idx + 1}:`);
          console.log(`    Membership ID: ${member.membershipId}`);
          console.log(`    Email:         ${member.email || 'N/A'}`);
          console.log(`    User ID:       ${member.userId || 'N/A'}`);
          console.log(`    Role:          ${member.role}`);
          console.log(`    Joined:        ${member.joinedAt || 'N/A'}`);
          console.log('');
        });
      }

      // Get pending invitations
      printSubsectionHeader('Pending Invitations');
      const invitations = await listInvitations(org.customerId);

      if (invitations.length === 0) {
        console.log('  No pending invitations\n');
      } else {
        console.log(`  Total Pending: ${invitations.length}\n`);

        invitations.forEach((invite, idx) => {
          console.log(`  Invitation ${idx + 1}:`);
          console.log(`    Invite ID:     ${invite.id}`);
          console.log(`    Email:         ${invite.email}`);
          console.log(`    Role:          ${invite.role}`);
          console.log(`    Created:       ${invite.createdAt || 'N/A'}`);
          if (invite.status) {
            console.log(`    Status:        ${invite.status}`);
          }
          console.log('');
        });
      }
    }

    // Summary
    printSectionHeader('Review Summary');
    console.log(`Total Organizations Reviewed: ${organizations.length}\n`);

    organizations.forEach((org, idx) => {
      console.log(`  ${idx + 1}. ${org.name} (${org.customerId})`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('REVIEW COMPLETE');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\nERROR: Review failed');
    console.error(error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
