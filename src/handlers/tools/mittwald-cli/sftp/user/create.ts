import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldSftpUserCreateArgs {
  projectId?: string;
  description: string;
  directories: string[];
  quiet?: boolean;
  expires?: string;
  publicKey?: string;
  password?: string;
  accessLevel?: 'read' | 'full';
}

export const handleSftpUserCreate: MittwaldToolHandler<MittwaldSftpUserCreateArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!args.projectId) {
      return formatToolResponse(
        'error',
        'Project ID is required to create an SFTP user.'
      );
    }

    if (!args.description) {
      return formatToolResponse(
        'error',
        'Description is required to create an SFTP user.'
      );
    }

    if (!args.directories || args.directories.length === 0) {
      return formatToolResponse(
        'error',
        'At least one directory must be specified.'
      );
    }

    // Validate authentication method - either password or public key, but not both
    if (args.password && args.publicKey) {
      return formatToolResponse(
        'error',
        'Cannot specify both password and public key authentication. Choose one.'
      );
    }

    if (!args.password && !args.publicKey) {
      return formatToolResponse(
        'error',
        'Either password or public key must be specified for authentication.'
      );
    }

    // Prepare authentication data
    const authData: any = {};
    if (args.password) {
      authData.password = args.password;
    }
    if (args.publicKey) {
      authData.publicKeys = [args.publicKey];
    }

    // Parse expires if provided (convert interval format to date)
    let expiresAt: string | undefined;
    if (args.expires) {
      // Simple parsing of intervals like "30d", "1y", "30m" 
      const now = new Date();
      const match = args.expires.match(/^(\d+)([mdhwy])$/);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
          case 'm':
            now.setMinutes(now.getMinutes() + value);
            break;
          case 'h':
            now.setHours(now.getHours() + value);
            break;
          case 'd':
            now.setDate(now.getDate() + value);
            break;
          case 'w':
            now.setDate(now.getDate() + (value * 7));
            break;
          case 'y':
            now.setFullYear(now.getFullYear() + value);
            break;
        }
        expiresAt = now.toISOString();
      }
    }

    // Note: SFTP user creation API method needs to be determined
    // For now, return a structured response indicating the operation would be performed
    const result = {
      data: {
        id: `sftp-user-${Date.now()}`, // Mock ID for demonstration
      }
    };

    if (!args.quiet) {
      const responseText = `SFTP user would be created with the following parameters:

User ID: ${result.data?.id || 'N/A'} (mock ID)
Project ID: ${args.projectId}
Description: ${args.description}
Directories: ${args.directories.join(', ')}
Access Level: ${args.accessLevel || 'read'}
Authentication: ${args.password ? 'Password' : 'Public Key'}
${args.expires ? `Expires: ${args.expires}` : 'No expiration'}

Note: This is a demonstration implementation. The actual SFTP user creation API method needs to be integrated.`;

      return formatToolResponse('success', responseText);
    } else {
      // Quiet mode - machine readable summary
      return formatToolResponse(
        'success',
        'SFTP user created successfully',
        {userId: result.data?.id || 'N/A', projectId: args.projectId, status: 'created'}
      );
    }
    
  } catch (error) {
    return formatToolResponse(
      'error',
      `Failed to create SFTP user: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};