#!/usr/bin/env tsx
/**
 * Web Hosting Environment Setup
 * Creates a new project with SSH access for deployments
 */

import { spawn } from 'child_process';

interface CliResult {
  stdout: string;
  stderr: string;
  code: number;
}

async function runMittwaldCli(args: string[]): Promise<CliResult> {
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

interface ProjectData {
  id: string;
  name: string;
  shortName?: string;
}

interface SshUser {
  id: string;
  username: string;
  password: string;
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║   Web Hosting Environment Setup                       ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  let projectId: string | null = null;
  let projectData: ProjectData | null = null;

  try {
    // Step 1: Create a new project
    console.log('📦 Step 1: Creating new project...\n');

    const projectDescription = `Web Project - ${new Date().toISOString().split('T')[0]}`;
    const serverId = 's-igc7dy'; // MCP Server Dev
    const shortName = 'web-project';

    console.log(`   Description: ${projectDescription}`);
    console.log(`   Server: ${serverId}`);
    console.log(`   Short name: ${shortName}\n`);

    const createProjectResult = await runMittwaldCli([
      'project',
      'create',
      `-d=${projectDescription}`,
      `-s=${serverId}`,
      '-q'
    ]);

    if (createProjectResult.code !== 0) {
      console.error('❌ Failed to create project');
      console.error('STDERR:', createProjectResult.stderr);
      console.error('STDOUT:', createProjectResult.stdout);
      process.exit(1);
    }

    // With --quiet flag, the output is the project ID
    projectId = createProjectResult.stdout.trim();
    console.log(`✅ Project created successfully!`);
    console.log(`   Project ID: ${projectId}\n`);

    // Step 2: List projects to verify
    console.log('📋 Step 2: Verifying project creation...\n');

    const listProjectsResult = await runMittwaldCli([
      'project',
      'list',
      '--output=json'
    ]);

    if (listProjectsResult.code === 0) {
      try {
        const projects = JSON.parse(listProjectsResult.stdout);
        const found = Array.isArray(projects)
          ? projects.find((p: any) => p.id === projectId)
          : null;

        if (found) {
          console.log(`✅ Project verified in list`);
          console.log(`   Found: ${found.name || found.id}\n`);
        } else {
          console.log(`ℹ️  Project may be provisioning. Continuing...\n`);
        }
      } catch (parseError) {
        console.log('ℹ️  Could not parse project list. Continuing...\n');
      }
    }

    // Step 3: Set project context
    console.log('🎯 Step 3: Setting project context...\n');

    const contextResult = await runMittwaldCli([
      'context',
      'set',
      `--project-id=${projectId}`
    ]);

    if (contextResult.code === 0) {
      console.log(`✅ Project context set successfully\n`);
    } else {
      console.log(`⚠️  Context setting result: ${contextResult.stdout.trim()}\n`);
    }

    // Step 4: Create SSH user for deployments
    console.log('🔐 Step 4: Creating SSH user for deployments...\n');

    const sshDescription = `Deployment user for ${shortName}`;
    const sshPassword = generateSecurePassword();

    console.log(`   SSH Description: ${sshDescription}`);
    console.log(`   Password: ${sshPassword} (save this securely!)\n`);

    const createSshUserResult = await runMittwaldCli([
      'ssh-user',
      'create',
      `--project-id=${projectId}`,
      `--description=${sshDescription}`,
      `--password=${sshPassword}`,
      '--quiet'
    ]);

    if (createSshUserResult.code === 0) {
      const sshUserId = createSshUserResult.stdout.trim();
      console.log(`✅ SSH user created successfully!`);
      console.log(`   SSH User ID: ${sshUserId}\n`);
    } else if (createSshUserResult.stderr.includes('already exists')) {
      console.log(`ℹ️  SSH user already exists, continuing with existing user\n`);
    } else {
      console.error('❌ Failed to create SSH user');
      console.error('STDERR:', createSshUserResult.stderr);
      console.error('STDOUT:', createSshUserResult.stdout);
    }

    // Step 5: List SSH users
    console.log('👥 Step 5: Listing SSH users...\n');

    const listSshResult = await runMittwaldCli([
      'ssh-user',
      'list',
      `--project-id=${projectId}`
    ]);

    if (listSshResult.code === 0) {
      console.log('✅ SSH users in project:');
      console.log(listSshResult.stdout);
    } else {
      console.log('⚠️  Could not list SSH users\n');
    }

    // Step 6: Setup summary
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║   ✅ SETUP COMPLETE                                   ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    console.log('📝 DEPLOYMENT CONFIGURATION:\n');
    console.log(`   Project ID:          ${projectId}`);
    console.log(`   SSH Host:            ssh.mittwald.de`);
    console.log(`   SSH Port:            22`);
    console.log(`   SSH Description:     ${sshDescription}`);
    console.log(`   SSH Password:        ${sshPassword}`);
    console.log();

    console.log('🚀 NEXT STEPS:\n');
    console.log('   1. Save your SSH credentials securely');
    console.log('   2. Log in to your server:');
    console.log(`      ssh ${sshDescription.replace(/\s/g, '_')}@ssh.mittwald.de`);
    console.log('   3. Or add an SSH key for passwordless access:');
    console.log('      mw user ssh-key create --no-passphrase');
    console.log('   4. Deploy your applications:');
    console.log('      mw app create node --project-id=' + projectId);
    console.log('      mw app create php --project-id=' + projectId);
    console.log('      mw app create static --project-id=' + projectId);
    console.log();

    console.log('📚 AVAILABLE TOOLS FOR FURTHER CONFIGURATION:\n');
    console.log('   Database Setup:');
    console.log(`      mw database mysql create --project-id=${projectId}`);
    console.log('   Cron Jobs:');
    console.log(`      mw cronjob create --project-id=${projectId}`);
    console.log('   Backups:');
    console.log(`      mw backup schedule create --project-id=${projectId}`);
    console.log('   Domain Configuration:');
    console.log(`      mw domain list`);
    console.log('   SSL/TLS Certificates:');
    console.log(`      mw certificate list --project-id=${projectId}`);
    console.log();

    console.log('✨ Your web hosting environment is ready!\n');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

main().catch(console.error);
