import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import { containerComprehensiveGuideResource, containerComprehensiveGuideContent } from './container-comprehensive-guide.js';
import { containerVirtualhostGuideResource, containerVirtualhostGuideContent } from './container-virtualhost-guide.js';
import { domainsGuideResource, domainsGuideContent } from './domains-guide.js';
import { commonConfusionsGuideResource, commonConfusionsGuideContent } from './common-confusions-guide.js';
import { opensearchStackExampleResource, opensearchStackExampleContent } from './opensearch-stack-example.js';

// Export all available resources
export const resources: Resource[] = [
  containerComprehensiveGuideResource,
  containerVirtualhostGuideResource,
  domainsGuideResource,
  commonConfusionsGuideResource,
  opensearchStackExampleResource
];

// Resource content handlers
export async function getResourceContent(uri: string): Promise<string> {
  switch (uri) {
    case 'mittwald://container-comprehensive-guide':
      return containerComprehensiveGuideContent;
    case 'guide://mittwald/container-virtualhost':
      return containerVirtualhostGuideContent;
    case 'guide://mittwald/domains-and-virtual-hosts':
      return domainsGuideContent;
    case 'guide://mittwald/common-confusions':
      return commonConfusionsGuideContent;
    case 'mittwald://opensearch-stack-example':
      return opensearchStackExampleContent;
    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
}