import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldProjectMembershipListArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  csvSeparator?: ',' | ';';
  noHeader?: boolean;
  noRelativeDates?: boolean;
  noTruncate?: boolean;
}

export const handleMittwaldProjectMembershipList: MittwaldToolHandler<MittwaldProjectMembershipListArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!args.projectId) {
      return formatToolResponse(
        'error',
        'Project ID is required. Use the projectId parameter to specify a project.'
      );
    }

    // Get memberships for the specified project
    const result = await mittwaldClient.project.listMembershipsForProject({
      projectId: args.projectId,
    });

    if (!result.data) {
      return formatToolResponse(
        'error',
        'No membership data received from API'
      );
    }

    const memberships = result.data as any[];
    
    // Apply formatting based on output type (reusing logic from membership-list-own)
    if (args.output === 'json') {
      return formatToolResponse(
        'success',
        'Memberships retrieved successfully',
        memberships
      );
    }

    if (args.output === 'yaml') {
      const yamlOutput = memberships.map(membership => `
- id: ${membership.id || 'N/A'}
  projectId: ${membership.projectId || 'N/A'}
  userId: ${membership.userId || 'N/A'}
  role: ${membership.role || 'N/A'}
  createdAt: ${membership.createdAt || 'N/A'}
  ${args.extended ? `
  updatedAt: ${membership.updatedAt || 'N/A'}` : ''}`).join('\n');

      return formatToolResponse(
        'success',
        'Memberships retrieved in YAML format',
        yamlOutput
      );
    }

    if (args.output === 'csv' || args.output === 'tsv') {
      const separator = args.output === 'csv' ? (args.csvSeparator || ',') : '\t';
      const headers = args.extended 
        ? ['ID', 'Project ID', 'User ID', 'Role', 'Created At', 'Updated At']
        : ['ID', 'Project ID', 'User ID', 'Role', 'Created At'];
      
      const headerRow = args.noHeader ? '' : headers.join(separator) + '\n';
      const dataRows = memberships.map(membership => {
        const basicData = [
          membership.id || '',
          membership.projectId || '',
          membership.userId || '',
          membership.role || '',
          membership.createdAt || ''
        ];
        
        if (args.extended) {
          basicData.push(membership.updatedAt || '');
        }
        
        return basicData.join(separator);
      }).join('\n');

      return formatToolResponse(
        'success',
        'Memberships retrieved in CSV/TSV format',
        headerRow + dataRows
      );
    }

    // Default txt format (table-like)
    if (memberships.length === 0) {
      return formatToolResponse(
        'success',
        'No memberships found for this project.',
        'No memberships found for this project.'
      );
    }

    const formatDate = (dateStr: string | undefined) => {
      if (!dateStr) return 'N/A';
      if (args.noRelativeDates) return dateStr;
      
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'today';
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return dateStr;
    };

    const truncate = (str: string, maxLength: number = 50) => {
      if (args.noTruncate || !str || str.length <= maxLength) return str;
      return str.substring(0, maxLength - 3) + '...';
    };

    let output = '';
    
    if (!args.noHeader) {
      const headers = args.extended 
        ? ['ID', 'Project ID', 'User ID', 'Role', 'Created', 'Updated']
        : ['ID', 'Project ID', 'User ID', 'Role', 'Created'];
      output += headers.join('\t') + '\n';
    }

    memberships.forEach(membership => {
      const row = [
        truncate(membership.id || 'N/A'),
        truncate(membership.projectId || 'N/A'),
        truncate(membership.userId || 'N/A'),
        membership.role || 'N/A',
        formatDate(membership.createdAt)
      ];

      if (args.extended) {
        row.push(formatDate(membership.updatedAt));
      }

      output += row.join('\t') + '\n';
    });

    return formatToolResponse(
      'success',
      'Memberships retrieved successfully',
      output.trim()
    );

  } catch (error) {
    return formatToolResponse(
      'error',
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
};