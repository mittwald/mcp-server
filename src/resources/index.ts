import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import { containerComprehensiveGuideResource, containerComprehensiveGuideContent } from './container-comprehensive-guide.js';
import { commonConfusionsGuideResource, commonConfusionsGuideContent } from './common-confusions-guide.js';
import { opensearchStackExampleResource, opensearchStackExampleContent } from './opensearch-stack-example.js';
import { ddevConfigResource, generateDdevConfig } from './ddev-config-generator.js';
import { ddevSetupInstructionsResource, generateDdevSetupInstructions } from './ddev-setup-instructions.js';
import { createMarkdownResources, handleMarkdownResourceRequest } from '../utils/resource-factory.js';

// Get markdown-based resources
const markdownResources = createMarkdownResources();

// Export all available resources
export const resources: Resource[] = [
  containerComprehensiveGuideResource,
  commonConfusionsGuideResource,
  opensearchStackExampleResource,
  ddevConfigResource,
  ddevSetupInstructionsResource,
  ...markdownResources
];

// Resource content handlers
export async function getResourceContent(uri: string, accessToken?: string): Promise<string> {
  const ddevConfigMatch = uri.match(/^mittwald:\/\/ddev\/config\/([a-z0-9-]+)$/i);
  if (ddevConfigMatch) {
    if (!accessToken) {
      throw new Error('Authentication required for DDEV config generation');
    }
    const appInstallationId = ddevConfigMatch[1];
    return generateDdevConfig(appInstallationId, accessToken);
  }

  const ddevSetupMatch = uri.match(/^mittwald:\/\/ddev\/setup-instructions\/([a-z0-9-]+)$/i);
  if (ddevSetupMatch) {
    if (!accessToken) {
      throw new Error('Authentication required for DDEV setup instructions');
    }
    const appInstallationId = ddevSetupMatch[1];
    return generateDdevSetupInstructions(appInstallationId, accessToken);
  }

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
