import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import { formatToolResponse } from '../../types.js';
// Removed unused imports
import {
  inviteListAllSuccessMessage,
  inviteListSuccessMessage,
  inviteCreateSuccessMessage,
  inviteGetSuccessMessage,
  inviteDeleteSuccessMessage,
  inviteAcceptSuccessMessage,
  inviteDeclineSuccessMessage,
  inviteResendSuccessMessage,
  tokenInviteGetSuccessMessage,
} from '../../../../constants/tool/mittwald/project/project-invitation.js';

/**
 * Handler for listing all project invitations
 */
export async function handleProjectInviteListAll(args: { limit?: number; skip?: number }) {
  try {
    const client = getMittwaldClient();
    
    // Prepare parameters
    const queryParams: any = {};
    if (args.limit) queryParams.limit = args.limit;
    if (args.skip) queryParams.skip = args.skip;

    const response = await client.api.project.listProjectInvites(queryParams);

    if (response.status !== 200) {
      throw new Error(`Failed to list project invitations: ${response.status} ${response.statusText}`);
    }

    return formatToolResponse({
      message: inviteListAllSuccessMessage,
      result: {
        invitations: response.data,
        count: response.data?.length || 0,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list project invitations: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

/**
 * Handler for listing project invitations
 */
export async function handleProjectInviteList(args: { projectId: string; limit?: number; skip?: number }) {
  try {
    const client = getMittwaldClient();
    
    // Prepare parameters
    const queryParams: any = {};
    if (args.limit) queryParams.limit = args.limit;
    if (args.skip) queryParams.skip = args.skip;

    const response = await client.api.project.listInvitesForProject({
      projectId: args.projectId,
      ...queryParams,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to list project invitations: ${response.status} ${response.statusText}`);
    }

    return formatToolResponse({
      message: inviteListSuccessMessage,
      result: {
        projectId: args.projectId,
        invitations: response.data,
        count: response.data?.length || 0,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list project invitations: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

/**
 * Handler for creating project invitation
 */
export async function handleProjectInviteCreate(args: { 
  projectId: string; 
  mailAddress: string; 
  role: string;
  membershipExpiresAt?: string;
  message?: string;
  language?: string;
}) {
  try {
    const client = getMittwaldClient();
    
    const inviteData: any = {
      mailAddress: args.mailAddress,
      role: args.role,
    };

    if (args.membershipExpiresAt) {
      inviteData.membershipExpiresAt = args.membershipExpiresAt;
    }

    if (args.message || args.language) {
      inviteData.messageCustomization = {};
      if (args.message) inviteData.messageCustomization.message = args.message;
      if (args.language) inviteData.messageCustomization.language = args.language;
    }

    const response = await client.api.project.createProjectInvite({
      projectId: args.projectId,
      data: inviteData,
    });

    if (response.status !== 201) {
      throw new Error(`Failed to create project invitation: ${response.status} ${response.statusText}`);
    }

    return formatToolResponse({
      message: inviteCreateSuccessMessage,
      result: {
        projectId: args.projectId,
        invitation: response.data,
        mailAddress: args.mailAddress,
        role: args.role,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to create project invitation: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

/**
 * Handler for getting invitation details
 */
export async function handleProjectInviteGet(args: { inviteId: string }) {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.project.getProjectInvite({ 
      projectInviteId: args.inviteId 
    });

    if (response.status !== 200) {
      throw new Error(`Failed to get invitation: ${response.status} ${response.statusText}`);
    }

    return formatToolResponse({
      message: inviteGetSuccessMessage,
      result: {
        invitation: response.data,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get invitation: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

/**
 * Handler for deleting invitation
 */
export async function handleProjectInviteDelete(args: { inviteId: string }) {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.project.deleteProjectInvite({ 
      projectInviteId: args.inviteId 
    });

    if (response.status !== 204) {
      throw new Error(`Failed to delete invitation: ${response.status} ${response.statusText}`);
    }

    return formatToolResponse({
      message: inviteDeleteSuccessMessage,
      result: {
        inviteId: args.inviteId,
        deleted: true,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to delete invitation: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

/**
 * Handler for accepting invitation
 */
export async function handleProjectInviteAccept(args: { inviteId: string }) {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.project.acceptProjectInvite({ 
      projectInviteId: args.inviteId 
    });

    if (response.status !== 204) {
      throw new Error(`Failed to accept invitation: ${response.status} ${response.statusText}`);
    }

    return formatToolResponse({
      message: inviteAcceptSuccessMessage,
      result: {
        inviteId: args.inviteId,
        accepted: true,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to accept invitation: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

/**
 * Handler for declining invitation
 */
export async function handleProjectInviteDecline(args: { inviteId: string }) {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.project.declineProjectInvite({ 
      projectInviteId: args.inviteId 
    });

    if (response.status !== 204) {
      throw new Error(`Failed to decline invitation: ${response.status} ${response.statusText}`);
    }

    return formatToolResponse({
      message: inviteDeclineSuccessMessage,
      result: {
        inviteId: args.inviteId,
        declined: true,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to decline invitation: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

/**
 * Handler for resending invitation
 */
export async function handleProjectInviteResend(args: { inviteId: string }) {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.project.resendProjectInviteMail({ 
      projectInviteId: args.inviteId 
    });

    if (response.status !== 204) {
      throw new Error(`Failed to resend invitation: ${response.status} ${response.statusText}`);
    }

    return formatToolResponse({
      message: inviteResendSuccessMessage,
      result: {
        inviteId: args.inviteId,
        resent: true,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to resend invitation: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

/**
 * Handler for getting token invite
 */
export async function handleProjectTokenInviteGet(args: { token: string }) {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.project.getProjectTokenInvite({
      headers: { token: args.token },
    });

    if (response.status !== 200) {
      throw new Error(`Failed to get token invitation: ${response.status} ${response.statusText}`);
    }

    return formatToolResponse({
      message: tokenInviteGetSuccessMessage,
      result: {
        token: args.token,
        invitation: response.data,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get token invitation: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}