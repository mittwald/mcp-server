import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import { containerComprehensiveGuideResource, containerComprehensiveGuideContent } from './container-comprehensive-guide.js';
import { commonConfusionsGuideResource, commonConfusionsGuideContent } from './common-confusions-guide.js';
import { opensearchStackExampleResource, opensearchStackExampleContent } from './opensearch-stack-example.js';

// Export all available resources
export const resources: Resource[] = [
  containerComprehensiveGuideResource,
  commonConfusionsGuideResource,
  opensearchStackExampleResource
];

// Resource content handlers
export async function getResourceContent(uri: string): Promise<string> {
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