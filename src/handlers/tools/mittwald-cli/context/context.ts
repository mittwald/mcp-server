import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { ContextParameters } from '../../../../constants/tool/mittwald-cli/context/context.js';

export const handleContext: MittwaldToolHandler<ContextParameters> = async (params, { mittwaldClient }) => {
  const { command, projectId, serverId, orgId, installationId, output = 'txt' } = params;
  
  try {
    switch (command) {
      case 'get':
        // In MCP context, read from environment variables rather than config files
        const contextData = {
          projectId: process.env.MITTWALD_PROJECT_ID || null,
          serverId: process.env.MITTWALD_SERVER_ID || null,
          orgId: process.env.MITTWALD_ORG_ID || null,
          installationId: process.env.MITTWALD_INSTALLATION_ID || null,
          apiToken: process.env.MITTWALD_API_TOKEN ? '***' : null // Masked for security
        };
        
        // Filter out null values
        const activeContext = Object.fromEntries(
          Object.entries(contextData).filter(([_, value]) => value !== null)
        );
        
        let formattedOutput;
        
        switch (output) {
          case 'json':
            formattedOutput = JSON.stringify(activeContext, null, 2);
            break;
          case 'txt':
          default:
            if (Object.keys(activeContext).length === 0) {
              formattedOutput = 'No context parameters are currently set in environment variables.';
            } else {
              formattedOutput = Object.entries(activeContext)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n');
            }
            break;
        }
        
        return formatToolResponse(
          "success",
          "Current context parameters (from environment):",
          {
            context: activeContext,
            formattedOutput: formattedOutput,
            format: output,
            note: "In MCP server context, configuration is read from environment variables"
          }
        );
        
      case 'reset':
        // In MCP context, we cannot modify persistent config files
        const contextParameters = [
          'projectId',
          'serverId', 
          'orgId',
          'installationId'
        ];
        
        const resetResult = {
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
          resetResult
        );
        
      case 'set':
        const setParameters: Record<string, string> = {};
        
        if (projectId) setParameters.projectId = projectId;
        if (serverId) setParameters.serverId = serverId;
        if (orgId) setParameters.orgId = orgId;
        if (installationId) setParameters.installationId = installationId;
        
        if (Object.keys(setParameters).length === 0) {
          return formatToolResponse(
            "error",
            "At least one parameter must be provided to set context"
          );
        }
        
        const setResult = {
          message: 'Context set requested - Note: In MCP server context, configuration changes are not persistent',
          explanation: 'The MCP server cannot modify persistent configuration files. These values would be used for this session only if the server supported runtime context changes.',
          requestedParameters: setParameters,
          currentEnvironmentContext: {
            projectId: process.env.MITTWALD_PROJECT_ID || null,
            serverId: process.env.MITTWALD_SERVER_ID || null,
            orgId: process.env.MITTWALD_ORG_ID || null,
            installationId: process.env.MITTWALD_INSTALLATION_ID || null
          },
          timestamp: new Date().toISOString()
        };
        
        const parametersList = Object.entries(setParameters)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        
        return formatToolResponse(
          "success",
          `Context set requested for: ${parametersList}. Note: In MCP context, use environment variables to configure these values persistently.`,
          setResult
        );
        
      default:
        return formatToolResponse(
          "error",
          `Unknown context command: ${command}`
        );
    }
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute context command ${command}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};