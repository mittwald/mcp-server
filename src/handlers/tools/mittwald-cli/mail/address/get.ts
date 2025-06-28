/**
 * @file Handler for mittwald_mail_address_get tool
 * @module handlers/tools/mittwald-cli/mail/address
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { ToolResponse } from '../../../../types/tool-response.js';

/**
 * Get a specific mail address
 * 
 * @param client - The Mittwald API client
 * @param args - Tool arguments
 * @returns Mail address details
 */
export async function handleMittwaldMailAddressGet(
  client: MittwaldAPIV2Client,
  args: {
    mailAddressId: string;
    output: 'txt' | 'json' | 'yaml';
  }
): Promise<ToolResponse> {
  try {
    // Get the mail address details
    const response = await client.mail.getMailAddress({
      mailAddressId: args.mailAddressId,
    });

    if (response.status === 200 && response.data) {
      const mailAddress = response.data;
      
      // Format the output based on the requested format
      switch (args.output) {
        case 'json':
          return {
            success: true,
            data: {
              format: 'json',
              content: JSON.stringify(mailAddress, null, 2),
              mailAddress,
            },
          };
          
        case 'yaml':
          // Simple YAML formatting
          const yamlContent = formatAsYaml(mailAddress);
          return {
            success: true,
            data: {
              format: 'yaml',
              content: yamlContent,
              mailAddress,
            },
          };
          
        case 'txt':
        default:
          // Human-readable text format
          const textContent = formatAsText(mailAddress);
          return {
            success: true,
            data: {
              format: 'txt',
              content: textContent,
              mailAddress,
            },
          };
      }
    }

    if (response.status === 404) {
      return {
        success: false,
        error: `Mail address ${args.mailAddressId} not found`,
      };
    }

    return {
      success: false,
      error: `Failed to get mail address: HTTP ${response.status}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle common error cases
    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      return {
        success: false,
        error: `Mail address ${args.mailAddressId} not found`,
      };
    }
    
    if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
      return {
        success: false,
        error: `Access denied: You don't have permission to access mail address ${args.mailAddressId}`,
      };
    }

    return {
      success: false,
      error: `Failed to get mail address: ${errorMessage}`,
    };
  }
}

/**
 * Format mail address data as human-readable text
 */
function formatAsText(mailAddress: any): string {
  const lines: string[] = [];
  
  lines.push(`Mail Address: ${mailAddress.address || 'N/A'}`);
  lines.push(`ID: ${mailAddress.mailAddressId || 'N/A'}`);
  
  if (mailAddress.projectId) {
    lines.push(`Project ID: ${mailAddress.projectId}`);
  }
  
  if (mailAddress.mailbox) {
    lines.push(`Type: Mailbox`);
    if (mailAddress.mailbox.quotaBytes) {
      lines.push(`Quota: ${formatBytes(mailAddress.mailbox.quotaBytes)}`);
    }
    if (mailAddress.mailbox.usedBytes !== undefined) {
      lines.push(`Used: ${formatBytes(mailAddress.mailbox.usedBytes)}`);
    }
    if (mailAddress.mailbox.enableSpamProtection !== undefined) {
      lines.push(`Spam Protection: ${mailAddress.mailbox.enableSpamProtection ? 'Enabled' : 'Disabled'}`);
    }
    if (mailAddress.mailbox.isCatchAll !== undefined) {
      lines.push(`Catch-All: ${mailAddress.mailbox.isCatchAll ? 'Yes' : 'No'}`);
    }
  } else if (mailAddress.forwardAddresses && mailAddress.forwardAddresses.length > 0) {
    lines.push(`Type: Forwarding`);
    lines.push(`Forward to: ${mailAddress.forwardAddresses.join(', ')}`);
  }
  
  return lines.join('\n');
}

/**
 * Format mail address data as YAML
 */
function formatAsYaml(mailAddress: any): string {
  const formatValue = (value: any, indent: string = ''): string => {
    if (value === null || value === undefined) {
      return 'null';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'boolean' || typeof value === 'number') {
      return String(value);
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      return '\n' + value.map(item => `${indent}  - ${formatValue(item, indent + '  ')}`).join('\n');
    }
    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) return '{}';
      return '\n' + entries.map(([key, val]) => 
        `${indent}  ${key}: ${formatValue(val, indent + '  ')}`
      ).join('\n');
    }
    return String(value);
  };

  const entries = Object.entries(mailAddress);
  return entries.map(([key, value]) => `${key}: ${formatValue(value)}`).join('\n');
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}