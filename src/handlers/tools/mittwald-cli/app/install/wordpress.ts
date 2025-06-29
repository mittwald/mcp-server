import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client';

export interface MittwaldAppInstallWordpressArgs {
  projectId: string;
  version?: string;
  host?: string;
  adminUser?: string;
  adminEmail?: string;
  adminPass?: string;
  siteTitle?: string;
  wait?: boolean;
  waitTimeout?: number;
}

export const handleAppInstallWordpress: MittwaldToolHandler<MittwaldAppInstallWordpressArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!args.projectId) {
      return formatToolResponse("error", "Project ID is required");
    }

    // Get user details for defaults
    const userResponse = await mittwaldClient.api.user.getProfile({});
    assertStatus(userResponse, 200);
    const user = userResponse.data;

    // Get project ingresses for default host
    const ingressResponse = await mittwaldClient.api.domain.listIngresses({
      queryParameters: {
        projectId: args.projectId
      }
    });
    assertStatus(ingressResponse, 200);

    // Find a suitable hostname
    let hostname = args.host;
    if (!hostname && ingressResponse.data.length > 0) {
      // Find first hostname that is not .mittwaldurl.dev
      const ingress = ingressResponse.data.find(i => 
        i.hostname && !i.hostname.endsWith('.mittwaldurl.dev')
      ) || ingressResponse.data[0];
      hostname = ingress.hostname;
    }

    if (!hostname) {
      return formatToolResponse("error", "No hostname found for project. Please specify a host parameter.");
    }

    // Prepare installation parameters
    const installParams = {
      projectId: args.projectId,
      requestBody: {
        app: {
          name: "WordPress",
          version: args.version || undefined
        },
        updatePolicy: "none" as const,
        userInputs: Object.entries({
          adminUser: args.adminUser || user.loginName || 'admin',
          adminEmail: args.adminEmail || user.email,
          adminPass: args.adminPass || generatePassword(),
          siteTitle: args.siteTitle || 'My WordPress Site',
          host: hostname
        }).reduce((acc, [key, value]) => ({
          ...acc,
          [key]: { value }
        }), {})
      }
    };

    // Create the installation
    const installResponse = await mittwaldClient.api.app.createAppinstallation(installParams);
    assertStatus(installResponse, 201);

    const appInstallationId = installResponse.data.id;

    // Wait for installation if requested
    if (args.wait) {
      const timeout = (args.waitTimeout || 600) * 1000; // Convert to milliseconds
      const startTime = Date.now();

      while (Date.now() - startTime < timeout) {
        const statusResponse = await mittwaldClient.api.app.getAppinstallation({
          appInstallationId
        });
        assertStatus(statusResponse, 200);

        if (statusResponse.data.appVersion.current) {
          // Installation complete
          return formatToolResponse(
            "success",
            "WordPress installation completed successfully",
            {
              appInstallationId,
              status: 'completed',
              app: statusResponse.data.app,
              version: statusResponse.data.appVersion.current,
              host: hostname,
              adminUser: args.adminUser || user.loginName || 'admin'
            }
          );
        }

        // Wait 5 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      throw new Error(`Installation timed out after ${args.waitTimeout || 600} seconds`);
    }

    // Return immediately without waiting
    return formatToolResponse(
      "success",
      "WordPress installation started",
      {
        appInstallationId,
        status: 'installing',
        host: hostname,
        adminUser: args.adminUser || user.loginName || 'admin'
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
};

// Helper function to generate secure password
function generatePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}