import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import { containerComprehensiveGuideResource, containerComprehensiveGuideContent } from './container-comprehensive-guide.js';
import { commonConfusionsGuideResource, commonConfusionsGuideContent } from './common-confusions-guide.js';
import { opensearchStackExampleResource, opensearchStackExampleContent } from './opensearch-stack-example.js';
import { createMarkdownResources, handleMarkdownResourceRequest } from '../utils/resource-factory.js';

// Get markdown-based resources
const markdownResources = createMarkdownResources();

// Export all available resources
export const resources: Resource[] = [
  containerComprehensiveGuideResource,
  commonConfusionsGuideResource,
  opensearchStackExampleResource,
  ...markdownResources
];

// Resource content handlers
export async function getResourceContent(uri: string): Promise<string> {
  // Check for markdown-based resources first
  const markdownContent = handleMarkdownResourceRequest(uri);
  if (markdownContent) {
    return markdownContent.text;
  }

  // Handle legacy resources
  switch (uri) {
    case 'mittwald://container-comprehensive-guide':
      return containerComprehensiveGuideContent;
    case 'guide://mittwald/common-confusions':
      return commonConfusionsGuideContent;
    case 'mittwald://opensearch-stack-example':
      return opensearchStackExampleContent;
    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
}