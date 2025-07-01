import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import { containerSafetyGuideResource, containerSafetyGuideContent } from './container-safety-guide.js';
import { containerVirtualhostGuideResource, containerVirtualhostGuideContent } from './container-virtualhost-guide.js';

// Export all available resources
export const resources: Resource[] = [
  containerSafetyGuideResource,
  containerVirtualhostGuideResource
];

// Resource content handlers
export async function getResourceContent(uri: string): Promise<string> {
  switch (uri) {
    case 'mittwald://container-safety-guide':
      return containerSafetyGuideContent;
    case 'guide://mittwald/container-virtualhost':
      return containerVirtualhostGuideContent;
    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
}