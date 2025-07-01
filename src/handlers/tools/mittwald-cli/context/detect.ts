import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { detectIdMixup } from '../../../../utils/context-validator.js';

interface ContextDetectArgs {
  id: string;
}

/**
 * Smart context detection tool that identifies what type of ID was provided
 * and helps users understand the Mittwald ID hierarchy
 */
export const handleContextDetect: MittwaldToolHandler<ContextDetectArgs> = async (args, { mittwaldClient }) => {
  try {
    const { id } = args;
    const result: any = {
      providedId: id,
      detectedType: 'unknown',
      context: {},
      hierarchy: {},
      suggestions: detectIdMixup(id)
    };

    // Detect ID type by format
    if (id.match(/^p-[a-z0-9]{6}$/)) {
      result.detectedType = 'project';
      
      // Get project details
      try {
        const projectResp = await mittwaldClient.project.getProject({ projectId: id });
        if (projectResp.status === 200) {
          result.context = {
            project: {
              id: projectResp.data.id,
              shortId: projectResp.data.shortId,
              description: projectResp.data.description,
              serverId: projectResp.data.serverId
            }
          };
          
          // Get server info
          if (projectResp.data.serverId) {
            const serverResp = await mittwaldClient.project.getServer({ 
              serverId: projectResp.data.serverId 
            });
            if (serverResp.status === 200) {
              result.hierarchy.server = {
                id: serverResp.data.id,
                shortId: serverResp.data.shortId,
                description: serverResp.data.description
              };
            }
          }

          // List stacks in project
          const stacksResp = await mittwaldClient.container.listStacks({ projectId: id });
          if (stacksResp.status === 200) {
            result.hierarchy.stacks = stacksResp.data.map(stack => ({
              id: stack.id,
              name: 'Stack'
            }));
          }

          // List apps in project
          const appsResp = await mittwaldClient.app.listAppinstallations({ projectId: id });
          if (appsResp.status === 200) {
            result.hierarchy.apps = appsResp.data.map(app => ({
              id: app.id,
              shortId: app.shortId,
              appId: app.appId,
              description: app.description
            }));
          }
        }
      } catch (error) {
        result.error = 'Project not found or inaccessible';
      }
    }
    
    else if (id.match(/^s-[a-z0-9]{6}$/)) {
      result.detectedType = 'server';
      
      try {
        const serverResp = await mittwaldClient.project.getServer({ serverId: id });
        if (serverResp.status === 200) {
          result.context = {
            server: {
              id: serverResp.data.id,
              shortId: serverResp.data.shortId,
              description: serverResp.data.description
            }
          };

          // List projects on server
          const projectsResp = await mittwaldClient.project.listProjects();
          if (projectsResp.status === 200) {
            result.hierarchy.projects = projectsResp.data
              .filter((project: any) => project.serverId === id)
              .map((project: any) => ({
                id: project.id,
                shortId: project.shortId,
                description: project.description
              }));
          }
        }
      } catch (error) {
        result.error = 'Server not found or inaccessible';
      }
    }
    
    else if (id.match(/^a-[a-z0-9]{6}$/)) {
      result.detectedType = 'app';
      
      try {
        const appResp = await mittwaldClient.app.getAppinstallation({ appInstallationId: id });
        if (appResp.status === 200) {
          result.context = {
            app: {
              id: appResp.data.id,
              shortId: appResp.data.shortId,
              appId: appResp.data.appId,
              projectId: appResp.data.projectId,
              description: appResp.data.description
            }
          };
          
          result.hierarchy.projectId = appResp.data.projectId;
          result.suggestions.push(`This app belongs to project: ${appResp.data.projectId}`);
        }
      } catch (error) {
        result.error = 'App not found or inaccessible';
      }
    }
    
    else if (id.match(/^c-[a-z0-9]{6}$/)) {
      result.detectedType = 'container';
      result.suggestions.push('Container IDs are used within stacks');
      result.suggestions.push('Use mittwald_container_list_services with the stack ID to find containers');
    }
    
    else if (id.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)) {
      result.detectedType = 'uuid';
      
      // Try as stack ID
      try {
        const stackResp = await mittwaldClient.container.getStack({ stackId: id });
        if (stackResp.status === 200) {
          result.detectedType = 'stack';
          result.context = {
            stack: {
              id: stackResp.data.id,
              name: 'Stack',
              projectId: stackResp.data.projectId
            }
          };
          
          result.hierarchy.projectId = stackResp.data.projectId;
          result.suggestions.push(`This stack belongs to project: ${stackResp.data.projectId}`);
          
          // Note: Can't directly list services for a specific stack in v2 API
          result.suggestions.push('Use mittwald_container_list_services with projectId to see all services');
        }
      } catch (error) {
        // Not a stack, could be other UUID types
        result.suggestions.push('This UUID could be a stack, ingress, or other resource ID');
      }
    }

    // Add helpful context about ID hierarchy
    result.idHierarchy = {
      explanation: "Mittwald ID Hierarchy:",
      levels: [
        "1. Server (s-XXXXXX) - Physical or virtual server",
        "2. Project (p-XXXXXX) - Container for apps, stacks, and domains",
        "3. Stack (UUID) - Container orchestration unit within a project",
        "4. App (a-XXXXXX) - Application installation within a project",
        "5. Container (c-XXXXXX) - Service within a stack",
        "6. Ingress/VirtualHost (UUID) - Domain routing configuration"
      ]
    };

    return formatToolResponse(
      "success",
      `Detected ${result.detectedType} ID: ${id}`,
      result
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to detect context: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};