import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client';
import { z } from 'zod';

export interface MittwaldAppUpgradeArgs {
  installationId?: string;
  targetVersion: string;
  force?: boolean;
  skipValidation?: boolean;
  quiet?: boolean;
  wait?: boolean;
  waitTimeout?: string;
}

export const mittwald_app_upgrade_schema = z.object({
  installationId: z.string().optional().describe("ID or short ID of an app installation; this argument is optional if a default app installation is set in the context"),
  targetVersion: z.string().describe("Target version to upgrade to"),
  force: z.boolean().optional().describe("Force the upgrade even if there are warnings"),
  skipValidation: z.boolean().optional().describe("Skip validation of the upgrade"),
  quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
  wait: z.boolean().optional().describe("Wait for the upgrade to complete"),
  waitTimeout: z.string().optional().describe("Maximum time to wait for the upgrade to complete")
});

export const handleAppUpgrade: MittwaldToolHandler<MittwaldAppUpgradeArgs> = async (args, { mittwaldClient, appContext }) => {
  try {
    const { targetVersion, force, skipValidation, quiet, wait, waitTimeout } = args;
    
    // Get installation ID from args or context
    const installationId = args.installationId || (appContext as any)?.installationId;
    if (!installationId) {
      return formatToolResponse(
        "error",
        "No installation ID provided. Please provide an installationId or set a default app installation context."
      );
    }

    // Get current app installation details
    const installationResponse = await mittwaldClient.app.getAppinstallation({
      appInstallationId: installationId
    });
    assertStatus(installationResponse, 200);
    
    const installation = installationResponse.data;
    if (!installation) {
      return formatToolResponse(
        "error",
        `App installation with ID "${installationId}" not found`
      );
    }

    // Get available versions for this app
    const versionsResponse = await mittwaldClient.app.listAppversions({
      appId: installation.appId
    });
    assertStatus(versionsResponse, 200);

    const versions = versionsResponse.data;
    const targetVersionObj = versions.find(v => 
      v.externalVersion === targetVersion || v.internalVersion === targetVersion || v.id === targetVersion
    );

    if (!targetVersionObj) {
      const availableVersions = versions.map(v => v.externalVersion).join(', ');
      return formatToolResponse(
        "error",
        `Target version "${targetVersion}" not found. Available versions: ${availableVersions}`
      );
    }

    // Check if target version is supported
    if (!targetVersionObj.supported) {
      if (!force) {
        return formatToolResponse(
          "error",
          `Target version "${targetVersion}" is not supported. Use --force to proceed anyway.`
        );
      }
    }

    // Perform the upgrade
    const upgradeResponse = await mittwaldClient.app.requestAppinstallationUpgrade({
      appInstallationId: installationId,
      data: {
        appVersionId: targetVersionObj.id
      }
    });
    assertStatus(upgradeResponse, 201);

    const upgradeRequest = upgradeResponse.data;

    if (!quiet) {
      return formatToolResponse(
        "success",
        `App upgrade initiated successfully`,
        {
          installationId: installationId,
          currentVersion: installation.appVersionId,
          targetVersion: targetVersionObj.externalVersion,
          upgradeId: upgradeRequest.id,
          status: "initiated",
          wait: wait,
          waitTimeout: waitTimeout
        }
      );
    }

    return formatToolResponse(
      "success",
      "App upgrade initiated",
      {
        upgradeId: upgradeRequest.id,
        status: "initiated"
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : 'Unknown error occurred during app upgrade'
    );
  }
};

export const mittwald_app_upgrade_handler = handleAppUpgrade;