import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { ContextResetParameters } from '../../../../constants/tool/mittwald-cli/context/reset.js';

export const handleContextReset: MittwaldToolHandler<ContextResetParameters> = async (params, { mittwaldClient }) => {
  try {
    // In an MCP server context, we cannot actually reset persistent config files
    // as we don't have access to the file system in the same way a CLI would.
    // This operation would normally clear values from ~/.config/mw/config.yml or similar
    
    const contextParameters = [
      'projectId',
      'serverId', 
      'orgId', 
      'installationId'
    ];
    
    // Explain the limitation in the MCP context
    const result = {
      message: 'Context reset requested - Note: In MCP server context, persistent configuration is managed differently',
      explanation: 'The MCP server cannot modify persistent configuration files. Context parameters are typically passed as environment variables or server arguments.',
      contextParameters: contextParameters,
      currentEnvironmentContext: {
        projectId: process.env.MITTWALD_PROJECT_ID || null,
        serverId: process.env.MITTWALD_SERVER_ID || null,
        orgId: process.env.MITTWALD_ORG_ID || null,
        installationId: process.env.MITTWALD_INSTALLATION_ID || null
      },
      timestamp: new Date().toISOString()
    };
    
    return formatToolResponse(
      "success",
      "Context reset requested. Note: In MCP context, configuration is managed through environment variables rather than persistent config files.",
      result
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to process context reset: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};