import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import { loadMarkdown, type MarkdownMetadata, MARKDOWN_REGISTRY } from './markdown-loader.js';

/**
 * Creates a resource from markdown documentation
 * @param metadata - The markdown file metadata
 * @returns Resource definition
 */
export function createMarkdownResource(metadata: MarkdownMetadata): Resource {
  if (!metadata.uri) {
    throw new Error(`Markdown metadata for ${metadata.filename} must include a URI`);
  }

  return {
    uri: metadata.uri,
    name: metadata.name,
    description: metadata.description,
    mimeType: 'text/markdown'
  };
}

/**
 * Create multiple resources from markdown files in the registry
 * @returns Array of resource definitions
 */
export function createMarkdownResources(): Resource[] {
  return MARKDOWN_REGISTRY
    .filter(metadata => metadata.uri) // Only create resources for entries with URIs
    .map(metadata => createMarkdownResource(metadata));
}

/**
 * Get the content for a markdown resource by URI
 * @param uri - The resource URI
 * @returns The markdown content
 */
export function getMarkdownResourceContent(uri: string): string {
  const metadata = MARKDOWN_REGISTRY.find(m => m.uri === uri);
  if (!metadata) {
    throw new Error(`No markdown resource found for URI: ${uri}`);
  }
  return loadMarkdown(metadata.filename);
}

/**
 * Handle resource content requests for markdown-based resources
 * @param uri - The resource URI
 * @returns Object with resource content details
 */
export function handleMarkdownResourceRequest(uri: string): {
  uri: string;
  mimeType: string;
  text: string;
} | null {
  const metadata = MARKDOWN_REGISTRY.find(m => m.uri === uri);
  if (!metadata) {
    return null;
  }

  return {
    uri,
    mimeType: 'text/markdown',
    text: loadMarkdown(metadata.filename)
  };
}