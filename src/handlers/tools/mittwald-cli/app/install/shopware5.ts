import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client';
import { logger } from '../../../../../utils/logger.js';
import { validateAppVersion } from './version-validator.js';

export interface MittwaldAppInstallShopware5Args {
  projectId: string;
  version?: string;
  host?: string;
  adminUser?: string;
  adminEmail?: string;
  adminPass?: string;
  adminFirstname?: string;
  adminLastname?: string;
  siteTitle?: string;
  shopEmail?: string;
  shopLang?: string;
  shopCurrency?: string;
  wait?: boolean;
  waitTimeout?: number;
}

export const handleAppInstallShopware5: MittwaldToolHandler<MittwaldAppInstallShopware5Args> = async (args, { mittwaldClient }) => {
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
        hostname = `shopware5-${projectShortId}.project.space`;
      }
    }

    // Shopware 5 app ID from CLI
    const shopware5AppId = "a23acf9c-9298-4082-9e7d-25356f9976dc";
    // Get available versions
    const versionsResponse = await mittwaldClient.app.listAppversions({ 
      appId: shopware5AppId 
    });
    assertStatus(versionsResponse, 200);
    
    // Find the recommended version or use specified version
    const versions = versionsResponse.data;
    let appVersionId;
    if (args.version) {
      const specificVersion = versions.find((v: any) => v.externalVersion === args.version);
      if (!specificVersion) {
        return formatToolResponse("error", `Shopware 5 version ${args.version} not found`);
      }
      appVersionId = specificVersion.id;
    } else {
      const recommendedVersion = versions.find((v: any) => v.recommended);
      appVersionId = recommendedVersion?.id || versions[0]?.id;
    }
    
    if (!appVersionId) {
      return formatToolResponse("error", "No Shopware 5 versions available");
    }

    // Prepare installation parameters with correct field names
    const userInputs = [
      { name: "admin_user", value: args.adminUser || 'admin' },
      { name: "admin_email", value: args.adminEmail || user.email || "admin@example.com" },
      { name: "admin_pass", value: args.adminPass || generateSecurePassword() },
      { name: "admin_firstname", value: args.adminFirstname || user.person?.firstName || "Admin" },
      { name: "admin_lastname", value: args.adminLastname || user.person?.lastName || "User" },
      { name: "site_title", value: args.siteTitle || 'My Shopware 5 Shop' },
      { name: "host", value: hostname || '' },
      { name: "shop_email", value: args.shopEmail || user.email || "shop@example.com" },
      { name: "shop_lang", value: args.shopLang || "en" },
      { name: "shop_currency", value: args.shopCurrency || "EUR" }
    ];

    // Create the installation
    const installResponse = await mittwaldClient.app.requestAppinstallation({
      projectId: args.projectId,
      data: {
        appVersionId,
        description: args.siteTitle || `Shopware 5 - ${args.projectId}`,
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
            "Shopware 5 installation completed successfully",
            {
              appInstallationId,
              status: 'completed',
              appId: statusResponse.data.appId,
              version: statusResponse.data.appVersion?.current || 'latest',
              host: hostname,
              adminUser: args.adminUser || 'admin',
              adminEmail: args.adminEmail || user.email || "admin@example.com",
              shopEmail: args.shopEmail || user.email || "shop@example.com",
              shopLang: args.shopLang || "en",
              shopCurrency: args.shopCurrency || "EUR"
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
      "Shopware 5 installation started",
      {
        appInstallationId,
        status: 'installing',
        host: hostname,
        adminUser: args.adminUser || 'admin',
        adminEmail: args.adminEmail || user.email || "admin@example.com",
        shopEmail: args.shopEmail || user.email || "shop@example.com",
        shopLang: args.shopLang || "en",
        shopCurrency: args.shopCurrency || "EUR"
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