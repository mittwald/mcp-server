import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import { containerSafetyGuideResource, containerSafetyGuideContent } from './container-safety-guide.js';

// Export all available resources
export const resources: Resource[] = [
  containerSafetyGuideResource
];

// Resource content handlers
export async function getResourceContent(uri: string): Promise<string> {
  switch (uri) {
    case 'mittwald://container-safety-guide':
      return containerSafetyGuideContent;
    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
}