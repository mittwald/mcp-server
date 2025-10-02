import { promisify } from 'node:util';
import { exec as execCallback } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const exec = promisify(execCallback);

const DOCKER_TARGETS = [
  'Dockerfile',
  'packages/mcp-server/Dockerfile',
  'openapi.Dockerfile',
  'stdio.Dockerfile'
] as const;

interface DockerVersionCheck {
  file: string;
  version: string | null;
}

/**
 * Fetches the latest published version of the Mittwald CLI from the npm registry.
 */
async function fetchLatestCliVersion(): Promise<string> {
  const { stdout } = await exec('npm view @mittwald/cli version');
  return stdout.trim();
}

/**
 * Extracts the pinned Mittwald CLI version from the provided Dockerfile path.
 */
async function readDockerfileVersion(file: string): Promise<DockerVersionCheck> {
  try {
    const absolutePath = resolve(process.cwd(), file);
    const contents = await readFile(absolutePath, 'utf8');
    const match = contents.match(/@mittwald\/cli@([0-9]+\.[0-9]+\.[0-9]+)/);

    return {
      file,
      version: match ? match[1] : null
    };
  } catch (error) {
    return {
      file,
      version: null
    };
  }
}

async function main(): Promise<void> {
  try {
    const latestVersion = await fetchLatestCliVersion();
    const dockerVersions = await Promise.all(
      DOCKER_TARGETS.map((file) => readDockerfileVersion(file))
    );

    const mismatches = dockerVersions.filter((entry) => entry.version !== latestVersion);

    if (mismatches.length > 0) {
      console.error(
        `CLI version mismatch: npm registry reports ${latestVersion}, but the following files differ:`
      );
      for (const mismatch of mismatches) {
        const message = mismatch.version
          ? `  - ${mismatch.file} pins ${mismatch.version}`
          : `  - ${mismatch.file} does not declare @mittwald/cli version`;
        console.error(message);
      }
      console.error('Update pinned versions to keep Docker images consistent.');
      process.exitCode = 1;
      return;
    }

    console.log(`CLI versions are in sync (npm: ${latestVersion}).`);
  } catch (error) {
    console.error('Failed to verify CLI version drift:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

void main();
