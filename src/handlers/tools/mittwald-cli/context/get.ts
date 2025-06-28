import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { ContextGetParameters } from '../../../../constants/tool/mittwald-cli/context/get.js';

export const handleContextGet: MittwaldToolHandler<ContextGetParameters> = async (params, { mittwaldClient }) => {
  const { output = 'txt' } = params;
  
  try {
    // Read context values from environment variables and configuration
    // This mimics how the CLI reads context from multiple sources
    const contextKeys = ['project-id', 'server-id', 'org-id', 'installation-id', 'stack-id'] as const;
    const contextData: Record<string, { value: string; source: string } | null> = {};
    
    // Check environment variables (following CLI naming convention)
    const envMapping = {
      'project-id': 'MITTWALD_PROJECT_ID',
      'server-id': 'MITTWALD_SERVER_ID', 
      'org-id': 'MITTWALD_ORG_ID',
      'installation-id': 'MITTWALD_INSTALLATION_ID',
      'stack-id': 'MITTWALD_STACK_ID'
    };
    
    for (const key of contextKeys) {
      const envVar = envMapping[key];
      const envValue = process.env[envVar];
      
      if (envValue) {
        contextData[key] = {
          value: envValue,
          source: `environment variable ${envVar}`
        };
      } else {
        contextData[key] = null;
      }
    }
    
    // Filter out null values for display
    const activeContext = Object.fromEntries(
      Object.entries(contextData).filter(([_, value]) => value !== null)
    ) as Record<string, { value: string; source: string }>;
    
    let formattedOutput;
    
    switch (output) {
      case 'json':
        // For JSON, include source information
        formattedOutput = JSON.stringify(activeContext, null, 2);
        break;
      case 'txt':
      default:
        if (Object.keys(activeContext).length === 0) {
          formattedOutput = 'No context parameters are currently set.\n\nTo set context parameters, use:\n  mw context set --project-id=<project-id>\n  mw context set --server-id=<server-id>\n  mw context set --org-id=<org-id>';
        } else {
          formattedOutput = Object.entries(activeContext)
            .map(([key, data]) => `${key}: ${data.value} (from ${data.source})`)
            .join('\n');
        }
        break;
    }
    
    return formatToolResponse(
      "success",
      Object.keys(activeContext).length > 0 
        ? `Found ${Object.keys(activeContext).length} context parameter(s):`
        : "No context parameters set",
      {
        context: Object.fromEntries(
          Object.entries(activeContext).map(([key, data]) => [key, data.value])
        ),
        contextWithSources: activeContext,
        formattedOutput,
        format: output
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to get context: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};