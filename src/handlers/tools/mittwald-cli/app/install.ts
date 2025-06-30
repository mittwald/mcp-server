import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { handleAppInstallContao } from './install/contao.js';
import { handleAppInstallJoomla } from './install/joomla.js';
import { handleAppInstallMatomo } from './install/matomo.js';
import { handleAppInstallNextcloud } from './install/nextcloud.js';
import { handleAppInstallShopware5 } from './install/shopware5.js';
import { handleAppInstallShopware6 } from './install/shopware6.js';
import { handleAppInstallTypo3 } from './install/typo3.js';
import { handleAppInstallWordpress } from './install/wordpress.js';

interface AppInstallInput {
  app_type: 'contao' | 'joomla' | 'matomo' | 'nextcloud' | 'shopware5' | 'shopware6' | 'typo3' | 'wordpress';
  project_id?: string;
  version?: string;
  quiet?: boolean;
  host?: string;
  admin_user?: string;
  admin_email?: string;
  admin_pass?: string;
  site_title?: string;
  wait?: boolean;
  wait_timeout?: string;
}

export const handleMittwaldAppInstall: MittwaldToolHandler<AppInstallInput> = async (
  input,
  context
) => {
  try {
    // Validate required fields
    if (!input.project_id) {
      return formatToolResponse("error", "Project ID is required");
    }
    
    if (!input.version) {
      return formatToolResponse(
        "error", 
        "Version is required. Please use mittwald_app_versions to get valid versions for your chosen app type and specify one explicitly."
      );
    }
    
    if (input.version === 'latest') {
      return formatToolResponse(
        "error", 
        "'latest' is not a valid version. Please use mittwald_app_versions to get valid versions for your chosen app type and choose the recommended version or a specific version from the list."
      );
    }

    // Map the generic parameters to app-specific parameters
    const commonArgs = {
      projectId: input.project_id,
      version: input.version,
      host: input.host,
      adminUser: input.admin_user,
      adminEmail: input.admin_email,
      adminPass: input.admin_pass,
      siteTitle: input.site_title,
      wait: input.wait,
      waitTimeout: input.wait_timeout ? parseInt(input.wait_timeout.replace('s', '')) : 600
    };

    // Dispatch to the appropriate app-specific handler
    switch (input.app_type) {
      case 'contao':
        return await handleAppInstallContao(commonArgs, context);
      
      case 'joomla':
        return await handleAppInstallJoomla(commonArgs, context);
      
      case 'matomo':
        return await handleAppInstallMatomo(commonArgs, context);
      
      case 'nextcloud':
        return await handleAppInstallNextcloud(commonArgs, context);
      
      case 'shopware5':
        return await handleAppInstallShopware5(commonArgs, context);
      
      case 'shopware6':
        return await handleAppInstallShopware6(commonArgs, context);
      
      case 'typo3':
        return await handleAppInstallTypo3({
          ...commonArgs,
          installMode: 'composer' // Default for TYPO3
        }, context);
      
      case 'wordpress':
        return await handleAppInstallWordpress(commonArgs, context);
      
      default:
        return formatToolResponse(
          "error",
          `Unknown app type: ${input.app_type}. Valid types are: contao, joomla, matomo, nextcloud, shopware5, shopware6, typo3, wordpress`
        );
    }

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to install ${input.app_type}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}