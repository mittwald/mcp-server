import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client';

export interface MittwaldAppUploadArgs {
  installationId: string;
  source: string;
  exclude?: string[];
  dryRun?: boolean;
  delete?: boolean;
  remoteSubDirectory?: string;
  sshUser?: string;
  sshIdentityFile?: string;
}

export const handleAppUpload: MittwaldToolHandler<MittwaldAppUploadArgs> = async (args, { mittwaldClient }) => {
  try {
    const { installationId, source, exclude, dryRun, delete: deleteFlag, remoteSubDirectory, sshUser, sshIdentityFile } = args;

    // Get app installation details
    const appResponse = await mittwaldClient.app.getAppinstallation({
      appInstallationId: installationId
    });
    assertStatus(appResponse, 200);
    
    const appInstallation = appResponse.data;
    const projectId = appInstallation.projectId;
    
    if (!projectId) {
      return formatToolResponse(
        "error",
        "App installation has no associated project ID"
      );
    }

    // Get SSH users for the project
    const sshUsersResponse = await mittwaldClient.sshsftpUser.sshUserListSshUsers({
      projectId: projectId
    });
    assertStatus(sshUsersResponse, 200);

    // Find appropriate SSH user
    let selectedSshUser = sshUser;
    if (!selectedSshUser && sshUsersResponse.data.length > 0) {
      selectedSshUser = (sshUsersResponse.data[0] as any).userName || sshUsersResponse.data[0].id;
    }

    if (!selectedSshUser) {
      return formatToolResponse(
        "error",
        "No SSH user available. Please specify an SSH user or ensure you have SSH access to this project."
      );
    }

    // Construct SSH hostname - this is a placeholder as actual hostname requires cluster info
    const sshHostname = `ssh.project.host`; // Would need actual cluster hostname
    
    // Build remote path
    const remotePath = remoteSubDirectory 
      ? `/html/${appInstallation.shortId}/${remoteSubDirectory}/`
      : `/html/${appInstallation.shortId}/`;

    // Build rsync command
    const rsyncArgs = [
      "rsync",
      "-avz",
      "--progress"
    ];

    if (dryRun) {
      rsyncArgs.push("--dry-run");
    }

    if (deleteFlag) {
      rsyncArgs.push("--delete");
    }

    if (exclude && exclude.length > 0) {
      exclude.forEach(pattern => {
        rsyncArgs.push(`--exclude="${pattern}"`);
      });
    }

    if (sshIdentityFile) {
      rsyncArgs.push(`-e "ssh -i ${sshIdentityFile}"`);
    }

    // Add source and destination
    rsyncArgs.push(source.endsWith('/') ? source : `${source}/`);
    rsyncArgs.push(`${selectedSshUser}@${sshHostname}:${remotePath}`);

    const rsyncCommand = rsyncArgs.join(" ");

    return formatToolResponse(
      "success",
      "File upload instructions prepared",
      {
        appInstallationId: installationId,
        appName: (appInstallation as any).appId || 'App',
        projectId: projectId,
        source: source,
        destination: `${selectedSshUser}@${sshHostname}:${remotePath}`,
        rsyncCommand: rsyncCommand,
        instructions: [
          "To upload files to your app installation, run the following rsync command:",
          "",
          rsyncCommand,
          "",
          "Prerequisites:",
          "- Ensure rsync is installed on your local machine",
          "- Ensure you have SSH access to the project",
          sshIdentityFile ? `- Ensure the SSH key file exists: ${sshIdentityFile}` : "- Configure SSH authentication",
          "",
          dryRun ? "Note: This is a dry-run command. Remove --dry-run to perform actual upload." : "",
          deleteFlag ? "Warning: This will delete files on the server that don't exist locally!" : "",
          "",
          "For more control, create a .mw-rsync-filter file in your source directory."
        ].filter(Boolean),
        warning: deleteFlag ? "This operation will delete remote files not present in the source directory!" : undefined
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
};