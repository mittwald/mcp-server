import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { ContextSetParameters } from '../../../../constants/tool/mittwald-cli/context/set.js';

export const handleContextSet: MittwaldToolHandler<ContextSetParameters> = async (params, { mittwaldClient }) => {
  const { projectId, serverId, orgId, installationId } = params;
  
  try {
    const setParameters: Record<string, string> = {};
    
    if (projectId) setParameters['project-id'] = projectId;
    if (serverId) setParameters['server-id'] = serverId;
    if (orgId) setParameters['org-id'] = orgId;
    if (installationId) setParameters['installation-id'] = installationId;
    
    if (Object.keys(setParameters).length === 0) {
      return formatToolResponse(
        "error",
        "At least one parameter must be provided to set context"
      );
    }
    
    // Validate project ID if provided by making an API call
    if (projectId) {
      try {
        const projectResponse = await mittwaldClient.project.api.getProject({ projectId });
        if (projectResponse.status !== 200) {
          return formatToolResponse(
            "error",
            `Invalid project ID '${projectId}': Project not found or access denied`
          );
        }
      } catch (error) {
        return formatToolResponse(
          "error",
          `Invalid project ID '${projectId}': ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
    
    // Note: In the MCP server context, we cannot persist configuration like the CLI does
    // The CLI saves to ~/.config/mw/config.yaml, but we can only suggest environment variables
    const envSuggestions = Object.entries(setParameters).map(([key, value]) => {
      const envVar = {
        'project-id': 'MITTWALD_PROJECT_ID',
        'server-id': 'MITTWALD_SERVER_ID',
        'org-id': 'MITTWALD_ORG_ID',
        'installation-id': 'MITTWALD_INSTALLATION_ID'
      }[key];
      return `export ${envVar}=${value}`;
    });
    
    const result = {
      message: 'Context parameters validated successfully',
      parameters: setParameters,
      environmentVariables: envSuggestions,
      note: 'In the MCP server context, parameters cannot be persisted to config files. Use environment variables instead.',
      timestamp: new Date().toISOString()
    };
    
    const parametersList = Object.entries(setParameters)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    return formatToolResponse(
      "success",
      `Context parameters validated: ${parametersList}`,
      result
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to set context: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};