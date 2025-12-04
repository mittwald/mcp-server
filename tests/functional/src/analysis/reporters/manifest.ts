/**
 * Manifest Generator (T056)
 *
 * Creates manifest of all generated analysis artifacts.
 */

import { writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

interface ArtifactEntry {
  file: string;
  type: string;
  size: number;
}

interface Manifest {
  generatedAt: string;
  artifacts: ArtifactEntry[];
}

/**
 * Determine artifact type from filename.
 */
function getArtifactType(filename: string): string {
  if (filename === 'corpus-index.json') return 'index';
  if (filename === 'incidents.json') return 'incidents';
  if (filename === 'dependencies.json') return 'dependencies';
  if (filename === 'dependencies.dot') return 'visualization';
  if (filename === 'summary.md') return 'report';
  if (filename === 'summary.json') return 'summary-data';
  if (filename === 'recommendations.json') return 'recommendations';
  if (filename === 'recommendations.md') return 'report';
  if (filename === 'manifest.json') return 'manifest';
  if (filename.endsWith('.md')) return 'domain-report';
  if (filename.endsWith('.json')) return 'data';
  if (filename.endsWith('.dot')) return 'visualization';
  return 'other';
}

/**
 * Recursively list files in directory.
 */
function listFilesRecursive(dir: string, basePath: string = ''): ArtifactEntry[] {
  const entries: ArtifactEntry[] = [];

  if (!existsSync(dir)) {
    return entries;
  }

  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const relativePath = basePath ? `${basePath}/${item}` : item;

    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      entries.push(...listFilesRecursive(fullPath, relativePath));
    } else if (stat.isFile()) {
      entries.push({
        file: relativePath,
        type: getArtifactType(item),
        size: stat.size,
      });
    }
  }

  return entries;
}

/**
 * Generate manifest of all artifacts in output directory.
 */
export function generateManifest(outputDir: string): Manifest {
  const artifacts = listFilesRecursive(outputDir);

  // Sort by file path
  artifacts.sort((a, b) => a.file.localeCompare(b.file));

  return {
    generatedAt: new Date().toISOString(),
    artifacts,
  };
}

/**
 * Export manifest to JSON file.
 */
export function exportManifest(outputDir: string, outputPath: string): void {
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const manifest = generateManifest(outputDir);
  writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf-8');
}
