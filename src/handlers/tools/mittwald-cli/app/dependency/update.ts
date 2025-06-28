import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { executeCommand } from '../../../../../utils/executeCommand.js';

interface AppDependencyUpdateInput {
  installation_id?: string;
  set: string[];
  update_policy?: 'none' | 'inheritedFromApp' | 'patchLevel' | 'all';
  quiet?: boolean;
}

export async function handleMittwaldAppDependencyUpdate(
  input: AppDependencyUpdateInput
): Promise<CallToolResult> {
  const args = ['app', 'dependency', 'update'];

  // Add installation ID if provided
  if (input.installation_id) {
    args.push(input.installation_id);
  }

  // Add set flags (required, can be multiple)
  for (const dependency of input.set) {
    args.push('--set', dependency);
  }

  // Add update policy if provided
  if (input.update_policy) {
    args.push('--update-policy', input.update_policy);
  }

  // Add quiet flag if requested
  if (input.quiet) {
    args.push('-q');
  }

  try {
    const { output, error } = await executeCommand(args);

    if (error) {
      throw new Error(error);
    }

    return {
      content: [
        {
          type: 'text',
          text: output || 'Dependencies updated successfully',
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to update app dependencies: ${errorMessage}`);
  }
}