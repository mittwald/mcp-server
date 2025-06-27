import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import { formatToolResponse } from '../../types.js';
import type {
  ListProjectsParams,
} from '../../../../types/mittwald/project.js';
import {
  projectListSuccessMessage,
  projectGetSuccessMessage,
  projectDeleteSuccessMessage,
  projectUpdateDescriptionSuccessMessage,
  projectUploadAvatarSuccessMessage,
  projectDeleteAvatarSuccessMessage,
  // projectGetJwtSuccessMessage, // Unused
  serverListProjectsSuccessMessage,
} from '../../../../constants/tool/mittwald/project/project-management.js';

/**
 * Handler for listing projects
 */
export async function handleProjectList(args: ListProjectsParams) {
  try {
    const client = getMittwaldClient();
    
    // Prepare parameters
    const queryParams: any = {};
    if (args.limit) queryParams.limit = args.limit;
    if (args.skip) queryParams.skip = args.skip;
    if (args.customerId) queryParams.customerId = args.customerId;
    if (args.serverId) queryParams.serverId = args.serverId;

    const response = await client.api.project.listProjects(queryParams);

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to list projects: ${response.status} ${response.statusText}`);
    }

    return formatToolResponse({
      message: projectListSuccessMessage,
      result: {
        projects: response.data,
        count: response.data?.length || 0,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list projects: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

/**
 * Handler for getting project details
 */
export async function handleProjectGet(args: { projectId: string }) {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.project.getProject({ 
      projectId: args.projectId 
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to get project: ${response.status} ${response.statusText}`);
    }

    return formatToolResponse({
      message: projectGetSuccessMessage,
      result: {
        project: response.data,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get project: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

/**
 * Handler for deleting a project
 */
export async function handleProjectDelete(args: { projectId: string }) {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.project.deleteProject({ 
      projectId: args.projectId 
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to delete project: ${response.status} ${response.statusText}`);
    }

    return formatToolResponse({
      message: projectDeleteSuccessMessage,
      result: {
        projectId: args.projectId,
        deleted: true,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to delete project: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

/**
 * Handler for updating project description
 */
export async function handleProjectUpdateDescription(args: { projectId: string; description: string }) {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.project.updateProjectDescription({
      projectId: args.projectId,
      data: { description: args.description },
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to update project description: ${response.status} ${response.statusText}`);
    }

    return formatToolResponse({
      message: projectUpdateDescriptionSuccessMessage,
      result: {
        projectId: args.projectId,
        description: args.description,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to update project description: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

/**
 * Handler for uploading project avatar
 */
export async function handleProjectUploadAvatar(args: { projectId: string; fileContent: string; filename: string; contentType?: string }) {
  try {
    const client = getMittwaldClient();
    
    // Convert base64 to buffer (currently not used by API)
    // const fileBuffer = Buffer.from(args.fileContent, 'base64');
    
    const response = await client.api.project.requestProjectAvatarUpload({
      projectId: args.projectId,
      headers: {
        'Content-Type': args.contentType || 'image/png',
      },
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to upload project avatar: ${response.status} ${response.statusText}`);
    }

    return formatToolResponse({
      message: projectUploadAvatarSuccessMessage,
      result: {
        projectId: args.projectId,
        filename: args.filename,
        uploaded: true,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to upload project avatar: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

/**
 * Handler for deleting project avatar
 */
export async function handleProjectDeleteAvatar(args: { projectId: string }) {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.project.deleteProjectAvatar({ 
      projectId: args.projectId 
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to delete project avatar: ${response.status} ${response.statusText}`);
    }

    return formatToolResponse({
      message: projectDeleteAvatarSuccessMessage,
      result: {
        projectId: args.projectId,
        deleted: true,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to delete project avatar: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

/**
 * Handler for getting project JWT (not available in current API)
 */
export async function handleProjectGetJwt(_args: { projectId: string }) {
  return formatToolResponse({
    status: "error",
    message: "Project JWT functionality is not available in the current Mittwald API",
    error: {
      type: "NOT_IMPLEMENTED",
      details: "This feature may be available in a future API version",
    },
  });
}

/**
 * Handler for listing server projects
 */
export async function handleServerListProjects(args: { serverId: string; limit?: number; skip?: number }) {
  try {
    const client = getMittwaldClient();
    
    // Prepare parameters
    const queryParams: any = {};
    if (args.limit) queryParams.limit = args.limit;
    if (args.skip) queryParams.skip = args.skip;

    // Note: This might need to be listProjects with serverId filter
    const response = await client.api.project.listProjects({
      serverId: args.serverId,
      ...queryParams,
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to list server projects: ${response.status} ${response.statusText}`);
    }

    return formatToolResponse({
      message: serverListProjectsSuccessMessage,
      result: {
        serverId: args.serverId,
        projects: response.data,
        count: response.data?.length || 0,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list server projects: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}