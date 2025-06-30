import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client';
import { logger } from '../../../../../utils/logger.js';
import { validateAppVersion } from './version-validator.js';

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
    const userResponse = await mittwaldClient.user.getUser({ userId: "self" });
    assertStatus(userResponse, 200);
    const user = userResponse.data;

    // Try to get project ingresses for default host
    let hostname = args.host;
    if (!hostname) {
      try {
        const ingressResponse = await mittwaldClient.domain.ingressListIngresses({
          queryParameters: { projectId: args.projectId }
        });
        
        if (ingressResponse.status === 200 && ingressResponse.data.length > 0) {
          // Find first hostname that is not .mittwaldurl.dev
          const ingress = ingressResponse.data.find((i: any) => 
            i.hostname && !i.hostname.endsWith('.mittwaldurl.dev')
          ) || ingressResponse.data[0];
          hostname = ingress.hostname;
        }
      } catch (error) {
        // If we can't get ingresses, generate a default hostname
        logger.debug('Could not get ingresses, using default hostname');
      }
      
      // If still no hostname, generate a default one
      if (!hostname) {
        // Extract project short ID if available
        const projectShortId = args.projectId.substring(0, 8);
        hostname = `wordpress-${projectShortId}.project.space`;
      }
    }

    // Get WordPress app ID and version
    const wordpressAppId = "da3aa3ae-4b6b-4398-a4a8-ee8def827876"; // WordPress app ID
    
    // Get available versions
    const versionsResponse = await mittwaldClient.app.listAppversions({ 
      appId: wordpressAppId 
    });
    assertStatus(versionsResponse, 200);
    
    // Validate version using the helper
    const versions = versionsResponse.data;
    const versionValidation = validateAppVersion('WordPress', args.version, versions);
    
    if (versionValidation.error) {
      return versionValidation.error;
    }
    
    const appVersionId = versionValidation.appVersionId!;

    // Prepare installation parameters with correct field names
    const userInputs = [
      { name: "admin_user", value: args.adminUser || 'admin' },
      { name: "admin_email", value: args.adminEmail || user.email || "admin@example.com" },
      { name: "admin_pass", value: args.adminPass || generatePassword() },
      { name: "site_title", value: args.siteTitle || 'My WordPress Site' },
      { name: "host", value: hostname || '' }
    ];

    // Create the installation
    const installResponse = await mittwaldClient.app.requestAppinstallation({
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
        const statusResponse = await mittwaldClient.app.getAppinstallation({
          appInstallationId
        });
        assertStatus(statusResponse, 200);

        if (statusResponse.data.appVersion?.current) {
          // Installation complete
          return formatToolResponse(
            "success",
            "WordPress installation completed successfully",
            {
              appInstallationId,
              status: 'completed',
              appId: statusResponse.data.appId,
              version: statusResponse.data.appVersion?.current || 'latest',
              host: hostname,
              adminUser: args.adminUser || user.email || 'admin'
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
        adminUser: args.adminUser || user.email || 'admin'
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