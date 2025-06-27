/**
 * @file Handlers for Mittwald SSH Keys API
 * @module handlers/tools/mittwald/ssh-backup/ssh-keys
 */

import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import { formatToolResponse } from '../../types.js';
import type {
  ListSshKeysArgs,
  CreateSshKeyArgs,
  GetSshKeyArgs,
  UpdateSshKeyArgs,
  DeleteSshKeyArgs,
} from '../../../../types/mittwald/ssh-backup.js';

export async function handleListSshKeys(_args: ListSshKeysArgs) {
  try {
    const client = getMittwaldClient();
    const response = await client.api.user.listSshKeys();

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully retrieved SSH keys",
      result: {
        sshKeys: response.data?.sshKeys || [],
        total: response.data?.sshKeys?.length || 0,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list SSH keys: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

export async function handleCreateSshKey(args: CreateSshKeyArgs) {
  try {
    const { label, publicKey, expiresAt } = args;
    const client = getMittwaldClient();
    
    const requestBody: any = {
      label,
      publicKey,
    };
    
    if (expiresAt) {
      requestBody.expiresAt = expiresAt;
    }

    const response = await client.api.user.createSshKey({ data: requestBody });

    if (response.status !== 201) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: `Successfully created SSH key "${label}"`,
      result: {
        sshKey: response.data,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to create SSH key: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

export async function handleGetSshKey(args: GetSshKeyArgs) {
  try {
    const { sshKeyId } = args;
    const client = getMittwaldClient();
    
    const response = await client.api.user.getSshKey({ sshKeyId });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully retrieved SSH key",
      result: {
        sshKey: response.data,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get SSH key: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}

export async function handleUpdateSshKey(_args: UpdateSshKeyArgs) {
  // Note: SSH key updates are not supported by the Mittwald API
  // Users need to delete and recreate SSH keys to update them
  return formatToolResponse({
    status: "error",
    message: "SSH key updates are not supported by the Mittwald API. Please delete and recreate the SSH key with new values.",
    error: {
      type: "NOT_SUPPORTED",
      details: "The Mittwald API does not provide an update method for SSH keys",
    },
  });
}

export async function handleDeleteSshKey(args: DeleteSshKeyArgs) {
  try {
    const { sshKeyId } = args;
    const client = getMittwaldClient();
    
    const response = await client.api.user.deleteSshKey({ sshKeyId });

    if (response.status !== 204) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatToolResponse({
      message: "Successfully deleted SSH key",
      result: {
        deleted: true,
        sshKeyId,
      },
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to delete SSH key: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
}