import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client';

export interface MittwaldAppOpenArgs {
  installationId?: string;
}

export const handleAppOpen: MittwaldToolHandler<MittwaldAppOpenArgs> = async (args, { mittwaldClient }) => {
  try {
    // Get installation ID from args
    const installationId = args.installationId;
    
    if (!installationId) {
      return formatToolResponse(
        'error',
        'App installation ID is required. Please provide the installationId parameter.'
      );
    }

    // Get app installation details
    const appResponse = await mittwaldClient.api.app.getAppinstallation({
      appInstallationId: installationId
    });
    assertStatus(appResponse, 200);
    
    const appInstallation = appResponse.data;
    
    // Get project ingresses to find the hostname
    const ingressResponse = await mittwaldClient.api.project.listIngresses({
      projectId: appInstallation.projectId
    });
    assertStatus(ingressResponse, 200);

    // Find ingress for this app installation
    const appIngresses = ingressResponse.data.filter((ingress: any) => 
      ingress.paths?.some((path: any) => path.target?.appInstallationId === installationId)
    );

    if (appIngresses.length === 0) {
      return formatToolResponse(
        "error",
        "No virtual hosts found for this app installation. The app needs at least one virtual host to be opened in a browser."
      );
    }

    // Find the primary ingress (prefer non-.mittwaldurl.dev domains)
    const primaryIngress = appIngresses.find((ingress: any) => 
      ingress.hostname && !ingress.hostname.endsWith('.mittwaldurl.dev')
    ) || appIngresses[0];

    if (!primaryIngress?.hostname) {
      return formatToolResponse(
        "error",
        "No valid hostname found for this app installation."
      );
    }

    // Construct the URL
    const protocol = primaryIngress.tls?.length > 0 ? 'https' : 'http';
    const url = `${protocol}://${primaryIngress.hostname}`;

    // Find the specific path for this app (if any)
    const appPath = primaryIngress.paths?.find((path: any) => 
      path.target?.appInstallationId === installationId
    );
    
    const fullUrl = appPath?.source ? `${url}${appPath.source}` : url;

    return formatToolResponse(
      "success",
      `App installation opened in browser`,
      {
        appInstallationId: installationId,
        appName: appInstallation.description || 'Unknown',
        url: fullUrl,
        hostname: primaryIngress.hostname,
        message: `Would open ${fullUrl} in your default browser`
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
};