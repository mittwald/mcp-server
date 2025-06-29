/**
 * @file Handler for mittwald_mail_address_create tool
 * @module handlers/tools/mittwald-cli/mail/address
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { ToolResponse } from '../../../../../../types/tool-response.js';

/**
 * Create a new mail address
 * 
 * @param client - The Mittwald API client
 * @param args - Tool arguments
 * @returns Mail address creation result
 */
export async function handleMittwaldMailAddressCreate(
  client: MittwaldAPIV2Client,
  args: {
    address: string;
    projectId?: string;
    quiet?: boolean;
    catchAll?: boolean;
    enableSpamProtection?: boolean;
    quota?: string;
    password?: string;
    randomPassword?: boolean;
    forwardTo?: string[];
  }
): Promise<ToolResponse> {
  try {
    // Validate mutually exclusive options
    if (args.password && args.randomPassword) {
      return {
        success: false,
        error: 'Cannot specify both password and randomPassword',
      };
    }
    
    if (args.forwardTo && args.forwardTo.length > 0) {
      if (args.catchAll || args.password || args.randomPassword || (args.quota && args.quota !== '1GiB')) {
        return {
          success: false,
          error: 'forwardTo is exclusive with catchAll, quota, password, and randomPassword',
        };
      }
    }

    // If no projectId provided, we need one from context or error
    if (!args.projectId) {
      return {
        success: false,
        error: 'Project ID is required. Please provide --project-id or set a default project context.',
      };
    }

    // Generate random password if requested
    let actualPassword = args.password;
    if (args.randomPassword && !args.forwardTo) {
      actualPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    }

    // Prepare request body based on whether it's forwarding or mailbox
    const requestBody: any = {
      address: args.address,
    };

    if (args.forwardTo && args.forwardTo.length > 0) {
      // Create forwarding address
      requestBody.forwardAddresses = args.forwardTo;
    } else {
      // Create mailbox
      requestBody.mailbox = {
        password: actualPassword || '',
        quotaBytes: parseQuota(args.quota || '1GiB'),
        enableSpamProtection: args.enableSpamProtection !== false,
        isCatchAll: args.catchAll || false,
      };
    }

    // Create the mail address
    const response = await client.mail.createMailAddress({
      projectId: args.projectId,
      data: requestBody,
    });

    if (response.status === 201 && response.data) {
      const mailAddressId = response.data.id;
      
      if (args.quiet) {
        if (args.randomPassword && actualPassword) {
          return {
            success: true,
            data: {
              mailAddressId,
              password: actualPassword,
            },
          };
        }
        return {
          success: true,
          data: {
            mailAddressId,
          },
        };
      }

      const result: any = {
        success: true,
        mailAddressId,
        address: args.address,
        projectId: args.projectId,
      };

      if (args.forwardTo && args.forwardTo.length > 0) {
        result.type = 'forwarding';
        result.forwardTo = args.forwardTo;
      } else {
        result.type = 'mailbox';
        result.quota = args.quota || '1GiB';
        result.spamProtection = args.enableSpamProtection !== false;
        result.catchAll = args.catchAll || false;
        if (args.randomPassword && actualPassword) {
          result.generatedPassword = actualPassword;
        }
      }

      return {
        success: true,
        data: result,
      };
    }

    return {
      success: false,
      error: `Failed to create mail address: ${response.status}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to create mail address: ${errorMessage}`,
    };
  }
}

/**
 * Parse quota string to bytes
 */
function parseQuota(quota: string): number {
  const match = quota.match(/^(\d+(?:\.\d+)?)\s*(GiB|MiB|KiB|B)?$/i);
  if (!match) {
    throw new Error(`Invalid quota format: ${quota}`);
  }
  
  const value = parseFloat(match[1]);
  const unit = (match[2] || 'B').toLowerCase();
  
  switch (unit) {
    case 'gib':
      return Math.floor(value * 1024 * 1024 * 1024);
    case 'mib':
      return Math.floor(value * 1024 * 1024);
    case 'kib':
      return Math.floor(value * 1024);
    case 'b':
    default:
      return Math.floor(value);
  }
}