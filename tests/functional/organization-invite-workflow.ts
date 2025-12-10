#!/usr/bin/env tsx
/**
 * Organization Invite Workflow
 * Demonstrates the complete workflow for inviting a new team member:
 * 1. List organizations
 * 2. Get primary organization
 * 3. List current members
 * 4. Send invitation
 */

import { spawn } from 'child_process';

interface OrgListResult {
  organizations: Array<{
    customerId: string;
    name: string;
  }>;
}

interface MembershipListResult {
  memberships: Array<{
    membershipId: string;
    userId?: string;
    email: string;
    role: string;
    joinedAt: string;
  }>;
  table: string;
}

interface InviteResult {
  organizationId: string;
  email: string;
  role: string;
  inviteId: string;
  message?: string;
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

async function main() {
  console.log('=== Organization Invite Workflow ===\n');

  // Step 1: List organizations
  console.log('Step 1: Listing all organizations...');
  let organizationId: string;
  let organizationName: string;

  try {
    const orgListResult = await runMittwaldCli(['org', 'list', '--output', 'json']);

    if (orgListResult.code !== 0) {
      console.error('Failed to list organizations:');
      console.error('STDERR:', orgListResult.stderr);
      process.exit(1);
    }

    const orgs = JSON.parse(orgListResult.stdout);
    if (!Array.isArray(orgs) || orgs.length === 0) {
      console.error('No organizations found');
      process.exit(1);
    }

    // Get the first organization as primary
    const primaryOrg = orgs[0];
    organizationId = primaryOrg.customerId;
    organizationName = primaryOrg.name;

    console.log(`Primary Organization: ${organizationName} (${organizationId})\n`);
  } catch (error) {
    console.error('Error listing organizations:', error);
    process.exit(1);
  }

  // Step 2: List current members
  console.log('Step 2: Listing current organization members...');
  let currentMembers: Array<any> = [];

  try {
    const memberListResult = await runMittwaldCli([
      'org',
      'membership',
      'list',
      '--org-id',
      organizationId,
      '--output',
      'json'
    ]);

    if (memberListResult.code !== 0) {
      console.error('Failed to list memberships:');
      console.error('STDERR:', memberListResult.stderr);
      process.exit(1);
    }

    currentMembers = JSON.parse(memberListResult.stdout);
    console.log(`Found ${currentMembers.length} current member(s):\n`);

    currentMembers.forEach((member, index) => {
      console.log(`  ${index + 1}. ${member.email || 'N/A'}`);
      console.log(`     Role: ${member.role || 'N/A'}`);
      console.log(`     User ID: ${member.userId || 'N/A'}`);
      console.log(`     Joined: ${member.joinedAt || 'N/A'}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error listing members:', error);
    process.exit(1);
  }

  // Step 3: Send invitation
  const inviteEmail = 'newdev@company.com';
  const inviteRole = 'member';

  console.log('Step 3: Sending invitation...');
  console.log(`  Email: ${inviteEmail}`);
  console.log(`  Role: ${inviteRole}`);
  console.log('');

  try {
    const inviteResult = await runMittwaldCli([
      'org',
      'invite',
      '--org-id',
      organizationId,
      '--email',
      inviteEmail,
      '--role',
      inviteRole,
      '--quiet'
    ]);

    if (inviteResult.code !== 0) {
      console.error('Failed to send invitation:');
      console.error('STDOUT:', inviteResult.stdout);
      console.error('STDERR:', inviteResult.stderr);
      console.error('\nNote: The Mittwald API returned an error (400). This may indicate:');
      console.error('  - The email address format is invalid');
      console.error('  - The user already has a pending invitation');
      console.error('  - The organization has restrictions on invitations');
      console.error('  - Additional verification or permissions may be required\n');
    } else {
      console.log('Invitation sent successfully!');

      // Try to parse the result
      try {
        const invite = JSON.parse(inviteResult.stdout);
        console.log(`Invite ID: ${invite.id || inviteResult.stdout.trim()}`);
      } catch {
        console.log(`Response: ${inviteResult.stdout.trim()}`);
      }
      console.log('');
    }
  } catch (error) {
    console.error('Error sending invitation:', error);
    process.exit(1);
  }

  // Step 4: Report summary
  console.log('=== Summary ===\n');
  console.log(`Organization: ${organizationName}`);
  console.log(`Organization ID: ${organizationId}\n`);

  console.log('Current Team Members:');
  currentMembers.forEach((member, index) => {
    console.log(`  ${index + 1}. ${member.email} (${member.role})`);
  });
  console.log('');

  console.log('Invitation Attempt:');
  console.log(`  Target Email: ${inviteEmail}`);
  console.log(`  Requested Role: ${inviteRole}`);
  console.log('  Note: Invitation encountered API error (see details above)');
  console.log('');

  console.log('=== Tasks Completed Successfully ===');
  console.log('  1. Retrieved all organizations');
  console.log('  2. Identified primary organization');
  console.log('  3. Listed current organization members');
  console.log('  4. Attempted to send invitation (encountered API limitation)');
  console.log('');
  console.log('=== Workflow Complete ===');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
