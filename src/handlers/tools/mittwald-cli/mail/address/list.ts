/**
 * @file Handler for mittwald_mail_address_list tool
 * @module handlers/tools/mittwald-cli/mail/address
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { ToolResponse } from '../../../../types/tool-response.js';

/**
 * Get all mail addresses for a project ID
 * 
 * @param client - The Mittwald API client
 * @param args - Tool arguments
 * @returns List of mail addresses
 */
export async function handleMittwaldMailAddressList(
  client: MittwaldAPIV2Client,
  args: {
    projectId?: string;
    output: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
    extended?: boolean;
    noHeader?: boolean;
    noTruncate?: boolean;
    noRelativeDates?: boolean;
    csvSeparator?: ',' | ';';
  }
): Promise<ToolResponse> {
  try {
    // If no projectId provided, we need one from context or error
    if (!args.projectId) {
      return {
        success: false,
        error: 'Project ID is required. Please provide --project-id or set a default project context.',
      };
    }

    // Get the mail addresses for the project
    const response = await client.mail.listMailAddresses({
      projectId: args.projectId,
    });

    if (response.status === 200 && response.data) {
      const mailAddresses = response.data;
      
      // Format the output based on the requested format
      switch (args.output) {
        case 'json':
          return {
            success: true,
            data: {
              format: 'json',
              content: JSON.stringify(mailAddresses, null, 2),
              mailAddresses,
              count: mailAddresses.length,
            },
          };
          
        case 'yaml':
          const yamlContent = formatAsYaml(mailAddresses);
          return {
            success: true,
            data: {
              format: 'yaml',
              content: yamlContent,
              mailAddresses,
              count: mailAddresses.length,
            },
          };
          
        case 'csv':
          const csvContent = formatAsCsv(mailAddresses, args.csvSeparator || ',', !args.noHeader, args.extended || false);
          return {
            success: true,
            data: {
              format: 'csv',
              content: csvContent,
              mailAddresses,
              count: mailAddresses.length,
            },
          };
          
        case 'tsv':
          const tsvContent = formatAsCsv(mailAddresses, '\t', !args.noHeader, args.extended || false);
          return {
            success: true,
            data: {
              format: 'tsv',
              content: tsvContent,
              mailAddresses,
              count: mailAddresses.length,
            },
          };
          
        case 'txt':
        default:
          const textContent = formatAsTable(mailAddresses, {
            extended: args.extended || false,
            noHeader: args.noHeader || false,
            noTruncate: args.noTruncate || false,
            noRelativeDates: args.noRelativeDates || false,
          });
          return {
            success: true,
            data: {
              format: 'txt',
              content: textContent,
              mailAddresses,
              count: mailAddresses.length,
            },
          };
      }
    }

    if (response.status === 404) {
      return {
        success: false,
        error: `Project ${args.projectId} not found`,
      };
    }

    return {
      success: false,
      error: `Failed to list mail addresses: HTTP ${response.status}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle common error cases
    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      return {
        success: false,
        error: `Project ${args.projectId} not found`,
      };
    }
    
    if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
      return {
        success: false,
        error: `Access denied: You don't have permission to access project ${args.projectId}`,
      };
    }

    return {
      success: false,
      error: `Failed to list mail addresses: ${errorMessage}`,
    };
  }
}

/**
 * Format mail addresses as table
 */
function formatAsTable(mailAddresses: any[], options: {
  extended: boolean;
  noHeader: boolean;
  noTruncate: boolean;
  noRelativeDates: boolean;
}): string {
  if (mailAddresses.length === 0) {
    return 'No mail addresses found.';
  }

  const headers = ['ID', 'Address', 'Type'];
  if (options.extended) {
    headers.push('Project ID', 'Quota', 'Used', 'Spam Protection');
  }

  const rows: string[][] = [];
  
  if (!options.noHeader) {
    rows.push(headers);
  }

  for (const address of mailAddresses) {
    const row = [
      address.mailAddressId || '',
      address.address || '',
      address.mailbox ? 'Mailbox' : 'Forwarding',
    ];

    if (options.extended) {
      row.push(
        address.projectId || '',
        address.mailbox ? formatBytes(address.mailbox.quotaBytes || 0) : 'N/A',
        address.mailbox ? formatBytes(address.mailbox.usedBytes || 0) : 'N/A',
        address.mailbox ? (address.mailbox.enableSpamProtection ? 'Yes' : 'No') : 'N/A'
      );
    }

    rows.push(row);
  }

  return formatTable(rows, options.noTruncate);
}

/**
 * Format mail addresses as CSV
 */
function formatAsCsv(mailAddresses: any[], separator: string, includeHeader: boolean, extended: boolean): string {
  const lines: string[] = [];
  
  const headers = ['ID', 'Address', 'Type'];
  if (extended) {
    headers.push('Project ID', 'Quota', 'Used', 'Spam Protection', 'Catch All', 'Forward To');
  }

  if (includeHeader) {
    lines.push(headers.join(separator));
  }

  for (const address of mailAddresses) {
    const row = [
      escapeCSV(address.mailAddressId || ''),
      escapeCSV(address.address || ''),
      escapeCSV(address.mailbox ? 'Mailbox' : 'Forwarding'),
    ];

    if (extended) {
      row.push(
        escapeCSV(address.projectId || ''),
        escapeCSV(address.mailbox ? formatBytes(address.mailbox.quotaBytes || 0) : 'N/A'),
        escapeCSV(address.mailbox ? formatBytes(address.mailbox.usedBytes || 0) : 'N/A'),
        escapeCSV(address.mailbox ? (address.mailbox.enableSpamProtection ? 'Yes' : 'No') : 'N/A'),
        escapeCSV(address.mailbox ? (address.mailbox.isCatchAll ? 'Yes' : 'No') : 'N/A'),
        escapeCSV(address.forwardAddresses ? address.forwardAddresses.join(', ') : 'N/A')
      );
    }

    lines.push(row.join(separator));
  }

  return lines.join('\n');
}

/**
 * Format mail addresses as YAML
 */
function formatAsYaml(mailAddresses: any[]): string {
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

  if (mailAddresses.length === 0) {
    return '[]';
  }

  return mailAddresses.map((address, index) => {
    const entries = Object.entries(address);
    const formatted = entries.map(([key, value]) => `  ${key}: ${formatValue(value, '  ')}`).join('\n');
    return `- # Mail Address ${index + 1}\n${formatted}`;
  }).join('\n');
}

/**
 * Format table with proper spacing
 */
function formatTable(rows: string[][], noTruncate: boolean): string {
  if (rows.length === 0) return '';

  // Calculate column widths
  const colWidths = rows[0].map(() => 0);
  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      const cellLength = String(row[i] || '').length;
      colWidths[i] = Math.max(colWidths[i], cellLength);
    }
  }

  // Limit column widths if truncation is enabled
  if (!noTruncate) {
    for (let i = 0; i < colWidths.length; i++) {
      colWidths[i] = Math.min(colWidths[i], 50); // Max 50 chars per column
    }
  }

  // Format rows
  return rows.map(row => {
    return row.map((cell, i) => {
      const str = String(cell || '');
      const width = colWidths[i];
      if (!noTruncate && str.length > width) {
        return str.substring(0, width - 3) + '...';
      }
      return str.padEnd(width);
    }).join(' ');
  }).join('\n');
}

/**
 * Escape CSV field
 */
function escapeCSV(field: string): string {
  if (field.includes(',') || field.includes(';') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
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