import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import { containerSafetyGuideResource, containerSafetyGuideContent } from './container-safety-guide.js';
import { containerVirtualhostGuideResource, containerVirtualhostGuideContent } from './container-virtualhost-guide.js';
import { domainsGuideResource, domainsGuideContent } from './domains-guide.js';
import { commonConfusionsGuideResource, commonConfusionsGuideContent } from './common-confusions-guide.js';

// Export all available resources
export const resources: Resource[] = [
  containerSafetyGuideResource,
  containerVirtualhostGuideResource,
  domainsGuideResource,
  commonConfusionsGuideResource
];

// Resource content handlers
export async function getResourceContent(uri: string): Promise<string> {
  switch (uri) {
    case 'mittwald://container-safety-guide':
      return containerSafetyGuideContent;
    case 'guide://mittwald/container-virtualhost':
      return containerVirtualhostGuideContent;
    case 'guide://mittwald/domains-and-virtual-hosts':
      return domainsGuideContent;
    case 'guide://mittwald/common-confusions':
      return commonConfusionsGuideContent;
    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
}