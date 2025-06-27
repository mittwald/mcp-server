/**
 * @file Handlers for Mittwald SFTP Users API
 * @module handlers/tools/mittwald/ssh-backup/sftp-users
 */

import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import { formatToolResponse } from '../../types.js';
import type {
  ListSftpUsersArgs,
  CreateSftpUserArgs,
  GetSftpUserArgs,
  UpdateSftpUserArgs,
  DeleteSftpUserArgs,
} from '../../../../types/mittwald/ssh-backup.js';

export async function handleListSftpUsers(args: ListSftpUsersArgs) {
  try {
    const { projectId } = args;
    const client = getMittwaldClient();
    
    const response = await client.api.sshsftpUser.sftpUserListSftpUsers({ projectId });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully retrieved SFTP users",
      result: {
        sftpUsers: response.data || [],
        total: response.data?.length || 0,
        projectId,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list SFTP users: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

export async function handleCreateSftpUser(args: CreateSftpUserArgs) {
  try {
    const { projectId, username, description, password } = args;
    const client = getMittwaldClient();
    
    const requestBody: any = {
      username,
    };
    
    if (description) {
      requestBody.description = description;
    }
    
    if (password) {
      requestBody.password = password;
    }

    const response = await client.api.sshsftpUser.sftpUserCreateSftpUser({ projectId, data: requestBody });

    if (response.status !== 201) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: `Successfully created SFTP user "${username}"`,
      result: {
        sftpUser: response.data,
        projectId,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to create SFTP user: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

export async function handleGetSftpUser(args: GetSftpUserArgs) {
  try {
    const { sftpUserId } = args;
    const client = getMittwaldClient();
    
    const response = await client.api.sshsftpUser.sftpUserGetSftpUser({ sftpUserId });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully retrieved SFTP user",
      result: {
        sftpUser: response.data,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get SFTP user: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

export async function handleUpdateSftpUser(args: UpdateSftpUserArgs) {
  try {
    const { sftpUserId, description, password, status } = args;
    const client = getMittwaldClient();
    
    const requestBody: any = {};
    
    if (description !== undefined) {
      requestBody.description = description;
    }
    
    if (password !== undefined) {
      requestBody.password = password;
    }
    
    if (status !== undefined) {
      requestBody.status = status;
    }

    const response = await client.api.sshsftpUser.sftpUserUpdateSftpUser({ sftpUserId, data: requestBody });

    if (response.status !== 204) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully updated SFTP user",
      result: {
        updated: true,
        sftpUserId,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to update SFTP user: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

export async function handleDeleteSftpUser(args: DeleteSftpUserArgs) {
  try {
    const { sftpUserId } = args;
    const client = getMittwaldClient();
    
    const response = await client.api.sshsftpUser.sftpUserDeleteSftpUser({ sftpUserId });

    if (response.status !== 204) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully deleted SFTP user",
      result: {
        deleted: true,
        sftpUserId,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to delete SFTP user: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}