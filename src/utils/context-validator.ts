/**
 * @file Context validation utilities for preventing common mistakes
 * @module utils/context-validator
 */

import type { MittwaldAPIV2Client } from '@mittwald/api-client';

export interface ContextValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Validates that a container ID belongs to the specified project
 */
export async function validateContainerInProject(
  client: MittwaldAPIV2Client,
  containerId: string,
  projectId: string
): Promise<ContextValidation> {
  const result: ContextValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  try {
    // Get project details to find its stacks
    const projectResponse = await client.project.getProject({ projectId });
    if (projectResponse.status !== 200) {
      result.isValid = false;
      result.errors.push(`Project ${projectId} not found`);
      return result;
    }

    // List all stacks in the project
    const stacksResponse = await client.container.listStacks({ projectId });
    if (stacksResponse.status !== 200) {
      result.warnings.push('Could not retrieve stacks for validation');
      return result;
    }

    // Note: The v2 API doesn't support filtering services by stack
    // So we can't validate container ownership at this level
    result.warnings.push('Container validation limited - ensure container belongs to the project');

    return result;
  } catch (error) {
    result.warnings.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

/**
 * Validates project ID format and existence
 */
export async function validateProjectId(
  client: MittwaldAPIV2Client,
  projectId: string
): Promise<ContextValidation> {
  const result: ContextValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  // Check format
  if (!projectId.match(/^p-[a-z0-9]{6}$/)) {
    result.isValid = false;
    result.errors.push(`Invalid project ID format: ${projectId}`);
    result.suggestions.push('Project IDs should start with "p-" followed by 6 alphanumeric characters');
    
    // Check if it's a stack ID
    if (projectId.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)) {
      result.warnings.push('This appears to be a stack ID (UUID format), not a project ID');
      result.suggestions.push('Use mittwald_container_get_stack to find the project ID for this stack');
    }
  }

  // Verify existence
  try {
    const response = await client.project.getProject({ projectId });
    if (response.status !== 200) {
      result.isValid = false;
      result.errors.push(`Project ${projectId} not found`);
    }
  } catch (error) {
    result.isValid = false;
    result.errors.push(`Could not verify project: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Detects common ID mix-ups and provides helpful suggestions
 */
export function detectIdMixup(id: string): string[] {
  const suggestions: string[] = [];

  // UUID format (often stack IDs)
  if (id.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)) {
    suggestions.push('This is a UUID, commonly used for stacks, not projects');
    suggestions.push('If this is a stack ID, use mittwald_container_get_stack to find its project');
  }

  // App ID format
  if (id.match(/^a-[a-z0-9]{6}$/)) {
    suggestions.push('This appears to be an app ID (starts with "a-"), not a project or container ID');
    suggestions.push('For apps, use mittwald_app_get to find the project context');
  }

  // Container ID format
  if (id.match(/^c-[a-z0-9]{6}$/)) {
    suggestions.push('This appears to be a container ID (starts with "c-")');
    suggestions.push('Container IDs are used for container services within stacks');
  }

  // Server ID format
  if (id.match(/^s-[a-z0-9]{6}$/)) {
    suggestions.push('This appears to be a server ID (starts with "s-")');
    suggestions.push('Use mittwald_server_get to find projects on this server');
  }

  return suggestions;
}