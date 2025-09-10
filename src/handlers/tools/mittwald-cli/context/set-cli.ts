import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldContextSetArgs {
  projectId?: string;
  serverId?: string;
  orgId?: string;
  installationId?: string;
  stackId?: string;
}

export const handleContextSetCli: MittwaldCliToolHandler<MittwaldContextSetArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['context', 'set'];
    
    // Add parameters
    const setParameters: Array<{ key: string; value: string; arg: string }> = [];
    
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
      setParameters.push({ key: 'project-id', value: args.projectId, arg: '--project-id' });
    }
    
    if (args.serverId) {
      cliArgs.push('--server-id', args.serverId);
      setParameters.push({ key: 'server-id', value: args.serverId, arg: '--server-id' });
    }
    
    if (args.orgId) {
      cliArgs.push('--org-id', args.orgId);
      setParameters.push({ key: 'org-id', value: args.orgId, arg: '--org-id' });
    }
    
    if (args.installationId) {
      cliArgs.push('--installation-id', args.installationId);
      setParameters.push({ key: 'installation-id', value: args.installationId, arg: '--installation-id' });
    }
    
    if (args.stackId) {
      cliArgs.push('--stack-id', args.stackId);
      setParameters.push({ key: 'stack-id', value: args.stackId, arg: '--stack-id' });
    }
    
    if (setParameters.length === 0) {
      return formatToolResponse(
        "error",
        "At least one parameter must be provided to set context"
      );
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      // Handle specific error cases
      if (errorMessage.includes('not found')) {
        return formatToolResponse(
          "error",
          `Invalid parameter value: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('access denied')) {
        return formatToolResponse(
          "error",
          `Access denied: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to set context: ${errorMessage}`
      );
    }
    
    // Parse success output
    const output = result.stdout.trim();
    const parametersList = setParameters
      .map(param => `${param.key}: ${param.value}`)
      .join(', ');
    
    const responseData = {
      message: 'Context parameters set successfully',
      parameters: Object.fromEntries(setParameters.map(p => [p.key, p.value])),
      output: output || null,
      timestamp: new Date().toISOString()
    };
    
    return formatToolResponse(
      "success",
      `Context parameters set: ${parametersList}`,
      responseData
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
