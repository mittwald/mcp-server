import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import { formatToolResponse } from '../../types.js';
import type {
  UpdateProjectMembershipParams,
} from '../../../../types/mittwald/project.js';
import {
  membershipListAllSuccessMessage,
  membershipListSuccessMessage,
  membershipGetSelfSuccessMessage,
  membershipGetSuccessMessage,
  membershipUpdateSuccessMessage,
  membershipRemoveSuccessMessage,
  // projectLeaveSuccessMessage, // Unused
} from '../../../../constants/tool/mittwald/project/project-membership.js';

/**
 * Handler for listing all project memberships
 */
export async function handleProjectMembershipListAll(args: { userId?: string; limit?: number; skip?: number }) {
  try {
    const client = getMittwaldClient();
    
    // Prepare parameters
    const queryParams: any = {};
    if (args.limit) queryParams.limit = args.limit;
    if (args.skip) queryParams.skip = args.skip;
    if (args.userId) queryParams.userId = args.userId;

    const response = await client.api.project.listProjectMemberships(queryParams);

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to list project memberships: ${response.status} ${response.statusText}`);
    }

    return formatToolResponse({
      message: membershipListAllSuccessMessage,
      result: {
        memberships: response.data,
        count: response.data?.length || 0,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list project memberships: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

/**
 * Handler for listing project memberships
 */
export async function handleProjectMembershipList(args: { projectId: string; limit?: number; skip?: number }) {
  try {
    const client = getMittwaldClient();
    
    // Prepare parameters
    const queryParams: any = {};
    if (args.limit) queryParams.limit = args.limit;
    if (args.skip) queryParams.skip = args.skip;

    const response = await client.api.project.listMembershipsForProject({
      projectId: args.projectId,
      ...queryParams,
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to list project memberships: ${response.status} ${response.statusText}`);
    }

    return formatToolResponse({
      message: membershipListSuccessMessage,
      result: {
        projectId: args.projectId,
        memberships: response.data,
        count: response.data?.length || 0,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list project memberships: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

/**
 * Handler for getting own membership
 */
export async function handleProjectMembershipGetSelf(args: { projectId: string }) {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.project.getSelfMembershipForProject({ 
      projectId: args.projectId 
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to get own membership: ${response.status} ${response.statusText}`);
    }

    return formatToolResponse({
      message: membershipGetSelfSuccessMessage,
      result: {
        projectId: args.projectId,
        membership: response.data,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get own membership: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

/**
 * Handler for getting membership details
 */
export async function handleProjectMembershipGet(args: { membershipId: string }) {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.project.getProjectMembership({ 
      projectMembershipId: args.membershipId 
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to get membership: ${response.status} ${response.statusText}`);
    }

    return formatToolResponse({
      message: membershipGetSuccessMessage,
      result: {
        membership: response.data,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get membership: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

/**
 * Handler for updating membership
 */
export async function handleProjectMembershipUpdate(args: { membershipId: string } & UpdateProjectMembershipParams) {
  try {
    const client = getMittwaldClient();
    
    const updateData: any = {};
    if (args.role) updateData.role = args.role;
    if (args.expiresAt) updateData.expiresAt = args.expiresAt;

    const response = await client.api.project.updateProjectMembership({
      projectMembershipId: args.membershipId,
      data: updateData,
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to update membership: ${response.status} ${response.statusText}`);
    }

    return formatToolResponse({
      message: membershipUpdateSuccessMessage,
      result: {
        membershipId: args.membershipId,
        updates: updateData,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to update membership: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

/**
 * Handler for removing membership
 */
export async function handleProjectMembershipRemove(args: { membershipId: string }) {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.project.deleteProjectMembership({ 
      projectMembershipId: args.membershipId 
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to remove membership: ${response.status} ${response.statusText}`);
    }

    return formatToolResponse({
      message: membershipRemoveSuccessMessage,
      result: {
        membershipId: args.membershipId,
        removed: true,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to remove membership: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

/**
 * Handler for leaving project (not available in current API)
 */
export async function handleProjectLeave(_args: { projectId: string }) {
  return formatToolResponse({
    status: "error",
    message: "Leave project functionality is not available in the current Mittwald API",
    error: {
      type: "NOT_IMPLEMENTED",
      details: "Use membership removal instead",
    },
  });
}