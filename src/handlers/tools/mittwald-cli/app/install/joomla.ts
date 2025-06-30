import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client';
import { logger } from '../../../../../utils/logger.js';
import { validateAppVersion } from './version-validator.js';

export interface MittwaldAppInstallJoomlaArgs {
  projectId: string;
  version?: string;
  host?: string;
  adminUser?: string;
  adminEmail?: string;
  adminPass?: string;
  adminFirstname?: string;
  adminLastname?: string;
  siteTitle?: string;
  wait?: boolean;
  waitTimeout?: number;
}

export const handleAppInstallJoomla: MittwaldToolHandler<MittwaldAppInstallJoomlaArgs> = async (args, { mittwaldClient }) => {
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
        hostname = `joomla-${projectShortId}.project.space`;
      }
    }

    // Joomla app ID from CLI
    const joomlaAppId = "8d404bff-6d75-4833-9eed-1b83b0552585";
    // Get available versions
    const versionsResponse = await mittwaldClient.app.listAppversions({ 
      appId: joomlaAppId 
    });
    assertStatus(versionsResponse, 200);
    
    // Validate version using the helper
    const versions = versionsResponse.data;
    const versionValidation = validateAppVersion('Joomla', args.version, versions);
    
    if (versionValidation.error) {
      return versionValidation.error;
    }
    
    const appVersionId = versionValidation.appVersionId!;

    // Prepare installation parameters with correct field names
    const userInputs = [
      { name: "admin_user", value: args.adminUser || 'admin' },
      { name: "admin_email", value: args.adminEmail || user.email || "admin@example.com" },
      { name: "admin_pass", value: args.adminPass || generateSecurePassword() },
      { name: "admin_firstname", value: args.adminFirstname || user.person?.firstName || "Admin" },
      { name: "admin_lastname", value: args.adminLastname || user.person?.lastName || "User" },
      { name: "site_title", value: args.siteTitle || 'My Joomla Site' },
      { name: "host", value: hostname || '' }
    ];

    // Create the installation
    const installResponse = await mittwaldClient.app.requestAppinstallation({
      projectId: args.projectId,
      data: {
        appVersionId,
        description: args.siteTitle || `Joomla - ${args.projectId}`,
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
            "Joomla installation completed successfully",
            {
              appInstallationId,
              status: 'completed',
              appId: statusResponse.data.appId,
              version: statusResponse.data.appVersion?.current || 'latest',
              host: hostname,
              adminUser: args.adminUser || 'admin',
              adminEmail: args.adminEmail || user.email || "admin@example.com"
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
      "Joomla installation started",
      {
        appInstallationId,
        status: 'installing',
        host: hostname,
        adminUser: args.adminUser || 'admin',
        adminEmail: args.adminEmail || user.email || "admin@example.com"
      }
    );
  } catch (error: any) {
    return formatToolResponse(
      "error",
      error.message || "An error occurred during installation"
    );
  }
};

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}