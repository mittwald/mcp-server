import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Cache for loaded markdown content to avoid repeated file reads
 */
const markdownCache = new Map<string, string>();

/**
 * Load markdown content from the documentation directory
 * @param filename - The markdown filename (without path, with .md extension)
 * @returns The markdown content as a string
 */
export function loadMarkdown(filename: string): string {
  // Check cache first
  if (markdownCache.has(filename)) {
    return markdownCache.get(filename)!;
  }

  try {
    // Construct the full path to the markdown file
    const fullPath = join(__dirname, '..', 'documentation', filename);
    
    // Read the file content
    const content = readFileSync(fullPath, 'utf-8');
    
    // Cache the content
    markdownCache.set(filename, content);
    
    return content;
  } catch (error) {
    throw new Error(`Failed to load markdown file ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clear the markdown cache (useful for development/testing)
 */
export function clearMarkdownCache(): void {
  markdownCache.clear();
}

/**
 * Get metadata about available markdown documentation files
 */
export interface MarkdownMetadata {
  filename: string;
  name: string;
  description: string;
  uri?: string;
}

/**
 * Registry of available markdown documentation files
 * This should be updated when new documentation is added
 */
export const MARKDOWN_REGISTRY: MarkdownMetadata[] = [
  {
    filename: 'docs/guides/virtualhost.md',
    name: 'Virtual Host Configuration Guide',
    description: 'Comprehensive guide for working with virtual hosts, domains, and document roots in Mittwald',
    uri: 'mittwald://help/virtualhost'
  }
];

/**
 * Get markdown content by URI
 * @param uri - The resource URI
 * @returns The markdown content or null if not found
 */
export function getMarkdownByUri(uri: string): string | null {
  const entry = MARKDOWN_REGISTRY.find(m => m.uri === uri);
  if (!entry) {
    return null;
  }
  return loadMarkdown(entry.filename);
}
