# Infrastructure Handler Migration Helper

## Quick Reference for Completing Migrations

This document provides copy-paste templates for completing the remaining infrastructure handler migrations.

## Import Block Template

Add to the top of each handler file:

```typescript
import { <LIBRARY_FN>, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';
```

Replace `<LIBRARY_FN>` with the appropriate function name from the table below.

## Handler Function Template

```typescript
export const handleXyzCli: MittwaldCliToolHandler<ArgsType> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  // Add required argument validation here
  if (!args.requiredField) {
    return formatToolResponse('error', 'requiredField is required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: '<TOOL_NAME>',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await <LIBRARY_FN>(<PARAMS>);
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: '<TOOL_NAME>',
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: '<TOOL_NAME>',
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result
    const data = validation.libraryOutput.data;

    // Format response appropriately
    return formatToolResponse(
      'success',
      '<SUCCESS_MESSAGE>',
      data,
      {
        durationMs: validation.libraryOutput.durationMs,
        validationPassed: validation.passed,
        discrepancyCount: validation.discrepancies.length,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    if (error instanceof CliToolError) {
      const message = mapCliError(error, args);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP04] Unexpected error in <HANDLER_NAME> handler', { error });
    return formatToolResponse('error', `Failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};
```

## Library Function Mapping

| Handler File | Tool Name | Library Function | Parameters |
|--------------|-----------|------------------|------------|
| **SFTP** | | | |
| sftp/user-list-cli.ts | mittwald_sftp_user_list | listSftpUsers | `{ projectId: args.projectId, apiToken: session.mittwaldAccessToken }` |
| sftp/user-create-cli.ts | mittwald_sftp_user_create | createSftpUser | `{ projectId: args.projectId, description: args.description, password: args.password, apiToken: session.mittwaldAccessToken }` |
| sftp/user-delete-cli.ts | mittwald_sftp_user_delete | deleteSftpUser | `{ sftpUserId: args.sftpUserId, apiToken: session.mittwaldAccessToken }` |
| sftp/user-update-cli.ts | mittwald_sftp_user_update | updateSftpUser | `{ sftpUserId: args.sftpUserId, description: args.description, password: args.password, active: args.active, apiToken: session.mittwaldAccessToken }` |
| **SSH (remaining)** | | | |
| ssh/user-create-cli.ts | mittwald_ssh_user_create | createSshUser | `{ projectId: args.projectId, description: args.description, publicKeys: args.publicKey ? [args.publicKey] : undefined, apiToken: session.mittwaldAccessToken }` |
| ssh/user-update-cli.ts | mittwald_ssh_user_update | updateSshUser | `{ sshUserId: args.sshUserId, description: args.description, active: args.enable ? true : args.disable ? false : undefined, apiToken: session.mittwaldAccessToken }` |
| **Volume (remaining)** | | | |
| volume/create-cli.ts | mittwald_volume_create | createVolume | `{ projectId: args.projectId, description: args.name, size: 10737418240, apiToken: session.mittwaldAccessToken }` |
| volume/delete-cli.ts | mittwald_volume_delete | deleteVolume | `{ volumeId: volumeName, apiToken: session.mittwaldAccessToken }` |
| **Server (remaining)** | | | |
| server/get-cli.ts | mittwald_server_get | getServer | `{ serverId: args.serverId, apiToken: session.mittwaldAccessToken }` |
| **Registry** | | | |
| registry/list-cli.ts | mittwald_registry_list | listRegistries | `{ projectId: args.projectId, apiToken: session.mittwaldAccessToken }` |
| registry/create-cli.ts | mittwald_registry_create | createRegistry | `{ projectId: args.projectId, description: args.description, apiToken: session.mittwaldAccessToken }` |
| registry/delete-cli.ts | mittwald_registry_delete | deleteRegistry | `{ registryId: args.registryId, apiToken: session.mittwaldAccessToken }` |
| registry/update-cli.ts | mittwald_registry_update | updateRegistry | `{ registryId: args.registryId, description: args.description, apiToken: session.mittwaldAccessToken }` |
| **Extension** | | | |
| extension/list-cli.ts | mittwald_extension_list | listExtensions | `{ appId: args.appId, apiToken: session.mittwaldAccessToken }` |
| extension/list-installed-cli.ts | mittwald_extension_list_installed | listInstalledExtensions | `{ installationId: args.installationId, apiToken: session.mittwaldAccessToken }` |
| extension/install-cli.ts | mittwald_extension_install | installExtension | `{ installationId: args.installationId, extensionId: args.extensionId, apiToken: session.mittwaldAccessToken }` |
| extension/uninstall-cli.ts | mittwald_extension_uninstall | uninstallExtension | `{ extensionInstanceId: args.extensionInstanceId, apiToken: session.mittwaldAccessToken }` |
| **Certificate** | | | |
| certificate/list-cli.ts | mittwald_certificate_list | listCertificates | `{ projectId: args.projectId, apiToken: session.mittwaldAccessToken }` |
| certificate/request-cli.ts | mittwald_certificate_request | requestCertificate | `{ ingressId: args.ingressId, apiToken: session.mittwaldAccessToken }` |
| **Conversation** | | | |
| conversation/list-cli.ts | mittwald_conversation_list | listConversations | `{ apiToken: session.mittwaldAccessToken }` |
| conversation/show-cli.ts | mittwald_conversation_show | getConversation | `{ conversationId: args.conversationId, apiToken: session.mittwaldAccessToken }` |
| conversation/create-cli.ts | mittwald_conversation_create | createConversation | `{ title: args.title, message: args.message, categoryId: args.categoryId, apiToken: session.mittwaldAccessToken }` |
| conversation/reply-cli.ts | mittwald_conversation_reply | replyToConversation | `{ conversationId: args.conversationId, message: args.message, apiToken: session.mittwaldAccessToken }` |
| conversation/close-cli.ts | mittwald_conversation_close | closeConversation | `{ conversationId: args.conversationId, apiToken: session.mittwaldAccessToken }` |
| conversation/categories-cli.ts | mittwald_conversation_categories | listConversationCategories | `{ apiToken: session.mittwaldAccessToken }` |
| **Stack** | | | |
| stack/list-cli.ts | mittwald_stack_list | listStacks | `{ projectId: args.projectId, apiToken: session.mittwaldAccessToken }` |
| stack/delete-cli.ts | mittwald_stack_delete | deleteStack | `{ stackId: args.stackId, apiToken: session.mittwaldAccessToken }` |

## Special Handling Notes

### Destructive Operations (Delete Handlers)
Add this BEFORE the session validation:

```typescript
// For delete handlers, validate confirm flag FIRST
if (args.confirm !== true) {
  return formatToolResponse(
    'error',
    '<Resource> deletion requires confirm=true. This operation is destructive and cannot be undone.'
  );
}

// Log destructive operation
logger.warn('[<Handler>Delete] Destructive operation attempted', {
  <resourceId>: args.<resourceId>,
  sessionId: effectiveSessionId,
});
```

### Credential Operations (SSH/SFTP Create/Update)
Use `buildSecureToolResponse()` instead of `formatToolResponse()` and sanitize credentials from logs.

### Volume Delete Special Case
Has pre-flight safety check for mounted volumes. Keep the existing `checkVolumeSafety()` function and call it before validation.

## Testing Each Migration

After migrating each handler, test with:

```bash
# Build the package
npm run build

# Run specific test if available
npm test -- --grep "<handler-name>"

# Manual test via MCP (if server is running)
# Use the tool through Claude Code or test client
```

## Batch Migration Script

For faster migration, you can use find/replace in VS Code:

1. Find: `export const handle(.+): MittwaldCliToolHandler<(.+)> = async \(args\)`
2. Replace: `export const handle$1: MittwaldCliToolHandler<$2> = async (args, sessionId)`

Then add the session/token validation block at the start of each handler.
