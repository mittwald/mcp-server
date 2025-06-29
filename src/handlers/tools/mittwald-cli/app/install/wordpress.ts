import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
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
    const userResponse = await mittwaldClient.api.user.getOwnAccount({});
    assertStatus(userResponse, 200);
    const user = userResponse.data;

    // Get project ingresses for default host
    const ingressResponse = await mittwaldClient.api.project.listIngresses({
      queryParameters: {
        projectId: args.projectId
      }
    });
    assertStatus(ingressResponse, 200);

    // Find a suitable hostname
    let hostname = args.host;
    if (!hostname && ingressResponse.data.length > 0) {
      // Find first hostname that is not .mittwaldurl.dev
      const ingress = ingressResponse.data.find((i: any) => 
        i.hostname && !i.hostname.endsWith('.mittwaldurl.dev')
      ) || ingressResponse.data[0];
      hostname = ingress.hostname;
    }

    if (!hostname) {
      return formatToolResponse("error", "No hostname found for project. Please specify a host parameter.");
    }

    // Get WordPress app ID and version
    const wordpressAppId = "da3e6217-b4aa-43d6-bfb9-9f22f92fa37b"; // WordPress app ID from CLI
    
    // Get available versions
    const versionsResponse = await mittwaldClient.api.app.listAppversions({ 
      appId: wordpressAppId 
    });
    assertStatus(versionsResponse, 200);
    
    // Find the recommended version or use specified version
    const versions = versionsResponse.data;
    let appVersionId;
    if (args.version) {
      const specificVersion = versions.find((v: any) => v.externalVersion === args.version);
      if (!specificVersion) {
        return formatToolResponse("error", `WordPress version ${args.version} not found`);
      }
      appVersionId = specificVersion.id;
    } else {
      const recommendedVersion = versions.find((v: any) => v.recommended);
      appVersionId = recommendedVersion?.id || versions[0]?.id;
    }
    
    if (!appVersionId) {
      return formatToolResponse("error", "No WordPress versions available");
    }

    // Prepare installation parameters
    const userInputs = [
      { name: "adminUser", value: args.adminUser || user.email || 'admin' },
      { name: "adminEmail", value: args.adminEmail || user.email },
      { name: "adminPass", value: args.adminPass || generatePassword() },
      { name: "siteTitle", value: args.siteTitle || 'My WordPress Site' },
      { name: "host", value: hostname }
    ];

    // Create the installation
    const installResponse = await mittwaldClient.api.app.requestAppinstallation({
      projectId: args.projectId,
      data: {
        appVersionId,
        description: args.siteTitle || `WordPress - ${args.projectId}`,
        updatePolicy: "none",
        userInputs
      }
    });
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
              appId: statusResponse.data.appId,
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