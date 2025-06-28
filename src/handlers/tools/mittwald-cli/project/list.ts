import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldProjectListArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  csvSeparator?: ',' | ';';
  noHeader?: boolean;
  noRelativeDates?: boolean;
  noTruncate?: boolean;
}

export const handleMittwaldProjectList: MittwaldToolHandler<MittwaldProjectListArgs> = async (args, { mittwaldClient }) => {
  try {
    // Get the list of projects from the API
    const result = await mittwaldClient.api.project.listProjects({});

    if (!result.data) {
      return formatToolResponse({
        success: false,
        error: 'No project data received from API'
      });
    }

    const projects = result.data;
    
    // Apply formatting based on output type
    if (args.output === 'json') {
      return formatToolResponse({
        success: true,
        data: projects
      });
    }

    if (args.output === 'yaml') {
      // Simple YAML-like format
      const yamlOutput = projects.map(project => `
- id: ${project.id}
  shortId: ${project.shortId || 'N/A'}
  description: ${project.description || 'N/A'}
  createdAt: ${project.createdAt || 'N/A'}
  serverId: ${project.serverId || 'N/A'}
  ${args.extended ? `
  enabled: ${project.enabled ?? 'N/A'}
  readiness: ${project.readiness || 'N/A'}` : ''}`).join('\n');

      return formatToolResponse({
        success: true,
        data: yamlOutput
      });
    }

    if (args.output === 'csv' || args.output === 'tsv') {
      const separator = args.output === 'csv' ? (args.csvSeparator || ',') : '\t';
      const headers = args.extended 
        ? ['ID', 'Short ID', 'Description', 'Created At', 'Server ID', 'Enabled', 'Readiness']
        : ['ID', 'Short ID', 'Description', 'Created At', 'Server ID'];
      
      const headerRow = args.noHeader ? '' : headers.join(separator) + '\n';
      const dataRows = projects.map(project => {
        const basicData = [
          project.id || '',
          project.shortId || '',
          project.description || '',
          project.createdAt || '',
          project.serverId || ''
        ];
        
        if (args.extended) {
          basicData.push(
            String(project.enabled ?? ''),
            project.readiness || ''
          );
        }
        
        return basicData.join(separator);
      }).join('\n');

      return formatToolResponse({
        success: true,
        data: headerRow + dataRows
      });
    }

    // Default txt format (table-like)
    if (projects.length === 0) {
      return formatToolResponse({
        success: true,
        data: 'No projects found.'
      });
    }

    const formatDate = (dateStr: string | undefined) => {
      if (!dateStr) return 'N/A';
      if (args.noRelativeDates) return dateStr;
      
      // Simple relative date formatting
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
        ? ['ID', 'Short ID', 'Description', 'Created', 'Server ID', 'Enabled', 'Readiness']
        : ['ID', 'Short ID', 'Description', 'Created', 'Server ID'];
      output += headers.join('\t') + '\n';
    }

    projects.forEach(project => {
      const row = [
        truncate(project.id || 'N/A'),
        truncate(project.shortId || 'N/A'),
        truncate(project.description || 'N/A'),
        formatDate(project.createdAt),
        truncate(project.serverId || 'N/A')
      ];

      if (args.extended) {
        row.push(
          String(project.enabled ?? 'N/A'),
          project.readiness || 'N/A'
        );
      }

      output += row.join('\t') + '\n';
    });

    return formatToolResponse({
      success: true,
      data: output.trim()
    });

  } catch (error) {
    return formatToolResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};