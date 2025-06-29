import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client';

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
    const userResponse = await mittwaldClient.api.user.getProfile({});
    assertStatus(userResponse, 200);
    const user = userResponse.data;

    // Get project ingresses for default host
    const ingressResponse = await mittwaldClient.api.domain.listIngresses({
      projectId: args.projectId,
    });
    assertStatus(ingressResponse, 200);
    const defaultHost = ingressResponse.data.length > 0 
      ? `https://${ingressResponse.data[0].hostname}`
      : undefined;

    // Get project details for site title generation
    const projectResponse = await mittwaldClient.project.getProject({
      projectId: args.projectId,
    });
    assertStatus(projectResponse, 200);
    const project = projectResponse.data;

    // Auto-fill flags with defaults
    const version = args.version || "latest";
    const host = args.host || defaultHost || "";
    const adminUser = args.adminUser || 
      `${user.person?.firstName?.charAt(0).toLowerCase() || 'a'}${user.person?.lastName?.toLowerCase() || 'admin'}`;
    const adminEmail = args.adminEmail || user.email;
    const adminPass = args.adminPass || generateSecurePassword();
    const adminFirstname = args.adminFirstname || user.person?.firstName || "Admin";
    const adminLastname = args.adminLastname || user.person?.lastName || "User";
    const siteTitle = args.siteTitle || `Joomla (${project.shortId})`;

    // Joomla app ID from CLI
    const appId = "8d404bff-6d75-4833-9eed-1b83b0552585";
    const versionsResponse = await mittwaldClient.app.listAppVersions({ appId });
    assertStatus(versionsResponse, 200);

    let appVersion;
    if (version === "latest") {
      appVersion = versionsResponse.data[0];
    } else {
      appVersion = versionsResponse.data.find(v => v.number === version);
      if (!appVersion) {
        throw new Error(`no version ${version} found for app Joomla`);
      }
    }

    // Trigger app installation
    const installResponse = await mittwaldClient.app.requestAppInstallation({
      projectId: args.projectId,
      appVersionId: appVersion.id,
      description: siteTitle,
      updatePolicy: "none",
      userInputs: [
        { name: "version", value: appVersion.number },
        { name: "host", value: host },
        { name: "admin_user", value: adminUser },
        { name: "admin_email", value: adminEmail },
        { name: "admin_pass", value: adminPass },
        { name: "admin_firstname", value: adminFirstname },
        { name: "admin_lastname", value: adminLastname },
        { name: "site_title", value: siteTitle },
      ],
    });
    assertStatus(installResponse, 201);
    const appInstallationId = installResponse.data.id;

    // Wait for installation to be retrievable
    let installation;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      try {
        const checkResponse = await mittwaldClient.app.getAppInstallation({
          appInstallationId,
        });
        if (checkResponse.status === 200) {
          installation = checkResponse.data;
          break;
        }
      } catch (error) {
        // Continue retrying
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } while (attempts < maxAttempts);

    if (!installation) {
      throw new Error("Installation could not be retrieved after creation");
    }

    // If wait flag, poll until installation completes
    if (args.wait) {
      const waitTimeout = args.waitTimeout || 600;
      const startTime = Date.now();
      
      while (true) {
        const statusResponse = await mittwaldClient.app.getAppInstallation({
          appInstallationId,
        });
        assertStatus(statusResponse, 200);
        const currentInstallation = statusResponse.data;
        
        if (currentInstallation.appVersion?.current === currentInstallation.appVersion?.desired) {
          break;
        }
        
        if ((Date.now() - startTime) / 1000 > waitTimeout) {
          throw new Error(`waiting for app installation to be ready took longer than ${waitTimeout}s`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successText = args.wait
      ? "Your Joomla installation is now complete. Have fun! 🎉"
      : "Your Joomla installation has started. Have fun when it's ready! 🎉";

    return formatToolResponse({
      message: successText,
      result: {
        appInstallationId,
        version: appVersion.number,
        host,
        adminUser,
        adminEmail,
        adminFirstname,
        adminLastname,
        siteTitle,
        generatedPassword: args.adminPass ? undefined : adminPass,
      }
    });
  } catch (error: any) {
    return formatToolResponse({
      status: "error",
      message: error.message,
      error: {
        type: "CLI_ERROR",
        details: error
      }
    });
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