/**
 * @file Handlers for Mittwald SSH Users API
 * @module handlers/tools/mittwald/ssh-backup/ssh-users
 */

import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import { formatToolResponse } from '../../types.js';
import type {
  ListSshUsersArgs,
  CreateSshUserArgs,
  GetSshUserArgs,
  UpdateSshUserArgs,
  DeleteSshUserArgs,
} from '../../../../types/mittwald/ssh-backup.js';

export async function handleListSshUsers(args: ListSshUsersArgs) {
  try {
    const { projectId } = args;
    const client = getMittwaldClient();
    
    const response = await client.api.sshsftpUser.sshUserListSshUsers({ projectId });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully retrieved SSH users",
      result: {
        sshUsers: response.data || [],
        total: response.data?.length || 0,
        projectId,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list SSH users: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

export async function handleCreateSshUser(args: CreateSshUserArgs) {
  try {
    const { projectId, username, description, publicKeys } = args;
    const client = getMittwaldClient();
    
    const requestBody: any = {
      username,
    };
    
    if (description) {
      requestBody.description = description;
    }
    
    if (publicKeys && publicKeys.length > 0) {
      requestBody.publicKeys = publicKeys;
    }

    const response = await client.api.sshsftpUser.sshUserCreateSshUser({ projectId, data: requestBody });

    if (response.status !== 201) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: `Successfully created SSH user "${username}"`,
      result: {
        sshUser: response.data,
        projectId,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to create SSH user: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

export async function handleGetSshUser(args: GetSshUserArgs) {
  try {
    const { sshUserId } = args;
    const client = getMittwaldClient();
    
    const response = await client.api.sshsftpUser.sshUserGetSshUser({ sshUserId });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully retrieved SSH user",
      result: {
        sshUser: response.data,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get SSH user: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

export async function handleUpdateSshUser(args: UpdateSshUserArgs) {
  try {
    const { sshUserId, description, publicKeys, status } = args;
    const client = getMittwaldClient();
    
    const requestBody: any = {};
    
    if (description !== undefined) {
      requestBody.description = description;
    }
    
    if (publicKeys !== undefined) {
      requestBody.publicKeys = publicKeys;
    }
    
    if (status !== undefined) {
      requestBody.status = status;
    }

    const response = await client.api.sshsftpUser.sshUserUpdateSshUser({ sshUserId, data: requestBody });

    if (response.status !== 204) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully updated SSH user",
      result: {
        updated: true,
        sshUserId,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to update SSH user: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

export async function handleDeleteSshUser(args: DeleteSshUserArgs) {
  try {
    const { sshUserId } = args;
    const client = getMittwaldClient();
    
    const response = await client.api.sshsftpUser.sshUserDeleteSshUser({ sshUserId });

    if (response.status !== 204) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully deleted SSH user",
      result: {
        deleted: true,
        sshUserId,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to delete SSH user: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}