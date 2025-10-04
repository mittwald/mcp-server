# Agent C2: Container Lifecycle Management

## Your Identity
You are **Agent C2**, responsible for **implementing the container update tool**. This is a non-interactive container lifecycle command that allows users to modify container attributes such as image, environment variables, port mappings, and volumes.

## Your Mission
Implement `mittwald_container_update` tool that wraps the `mw container update` CLI command, following the same patterns established by existing container tools.

## Required Reading (Read in Order)

### Architecture & Context
1. **`LLM_CONTEXT.md`** - Complete project overview (read first!)
2. **`ARCHITECTURE.md`** - OAuth bridge and MCP server architecture
3. **`docs/mcp-cli-gap-architecture.md`** - Gap analysis and container update priority

### Existing Container Tool Patterns
4. **`src/constants/tool/mittwald-cli/container/recreate-cli.ts`** - Similar container modification tool
5. **`src/handlers/tools/mittwald-cli/container/recreate-cli.ts`** - Handler pattern
6. **`src/constants/tool/mittwald-cli/container/delete-cli.ts`** - Quiet mode handling
7. **`src/handlers/tools/mittwald-cli/container/delete-cli.ts`** - Error mapping pattern

### CLI Integration
8. **`src/tools/cli-adapter.ts`** - invokeCliTool function
9. **`src/utils/session-aware-cli.ts`** - Session context injection
10. **`src/utils/format-tool-response.ts`** - Response formatting

### Coverage Data
11. **`docs/mittwald-cli-coverage.md`** - Line showing `container update` as missing
12. **`mw-cli-coverage.json`** - Verify the gap

## Your Task List

### Task C2.1: Study the Container Update CLI

- [ ] Run locally (if possible):
  ```bash
  mw container update --help
  ```

- [ ] Document the CLI flags:
  - `CONTAINER-ID` (required)
  - `--image <value>` - Update container image
  - `--env` / `-e <value>...` - Environment variables (multiple)
  - `--env-file <value>...` - Environment variable files (multiple)
  - `--description <value>` - Descriptive label
  - `--entrypoint <value>` - Override entrypoint
  - `--command <value>` - Override command
  - `--publish` / `-p <value>...` - Port mappings (multiple)
  - `--publish-all` / `-P` - Publish all exposed ports
  - `--volume` / `-v <value>...` - Volume mounts (multiple)
  - `--recreate` - Recreate container after updating
  - `--quiet` / `-q` - Machine-readable output
  - `--project-id` / `-p <value>` - Project context

- [ ] Understand the behavior:
  - Updates container configuration
  - Optionally recreates the container to apply changes immediately
  - Returns container ID in quiet mode
  - Can update multiple attributes in one call

- [ ] Commit with message: `docs(container): document container update CLI behavior`

---

### Task C2.2: Create Tool Definition

- [ ] Create file: `src/constants/tool/mittwald-cli/container/update-cli.ts`
- [ ] Define tool schema:
  ```typescript
  import type { Tool } from '@modelcontextprotocol/sdk/types.js';
  import type { ToolRegistration } from '../../../../types/tool-registry.js';
  import { handleContainerUpdateCli } from '../../../../handlers/tools/mittwald-cli/container/update-cli.js';

  const tool: Tool = {
    name: 'mittwald_container_update',
    title: 'Update Container',
    description: 'Updates attributes of an existing container such as image, environment variables, port mappings, and volumes.',
    inputSchema: {
      type: 'object',
      properties: {
        containerId: {
          type: 'string',
          description: 'Container ID or short ID to update'
        },
        image: {
          type: 'string',
          description: 'Update the container image (e.g., "nginx:latest", "mysql:8.0")'
        },
        env: {
          type: 'array',
          items: { type: 'string' },
          description: 'Environment variables in KEY=VALUE format. Multiple values can be specified.'
        },
        envFile: {
          type: 'array',
          items: { type: 'string' },
          description: 'Paths to files containing environment variables (one KEY=VALUE per line). Multiple files can be specified.'
        },
        description: {
          type: 'string',
          description: 'Update the descriptive label of the container'
        },
        entrypoint: {
          type: 'string',
          description: 'Override the entrypoint of the container'
        },
        command: {
          type: 'string',
          description: 'Update the command to run in the container (overrides image default)'
        },
        publish: {
          type: 'array',
          items: { type: 'string' },
          description: 'Port mappings in format <host-port>:<container-port> or just <container-port>. Multiple mappings can be specified.'
        },
        publishAll: {
          type: 'boolean',
          description: 'Automatically publish all ports exposed by the container image'
        },
        volume: {
          type: 'array',
          items: { type: 'string' },
          description: 'Volume mounts in format <host-path>:<container-path> or <named-volume>:<container-path>. Multiple volumes can be specified.'
        },
        recreate: {
          type: 'boolean',
          description: 'Recreate the container after updating to apply changes immediately'
        },
        quiet: {
          type: 'boolean',
          description: 'Suppress process output and only display a machine-readable summary'
        },
        projectId: {
          type: 'string',
          description: 'Project ID or short ID (optional if default project is set in context)'
        }
      },
      required: ['containerId']
    }
  };

  const registration: ToolRegistration = {
    tool,
    handler: handleContainerUpdateCli,
    schema: tool.inputSchema
  };

  export default registration;
  ```

- [ ] Commit with message: `feat(container): add container update tool definition`

---

### Task C2.3: Implement Handler

- [ ] Create file: `src/handlers/tools/mittwald-cli/container/update-cli.ts`
- [ ] Implement handler following existing patterns:
  ```typescript
  import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
  import { formatToolResponse } from '../../../../utils/format-tool-response.js';
  import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

  interface MittwaldContainerUpdateCliArgs {
    containerId: string;
    image?: string;
    env?: string[];
    envFile?: string[];
    description?: string;
    entrypoint?: string;
    command?: string;
    publish?: string[];
    publishAll?: boolean;
    volume?: string[];
    recreate?: boolean;
    quiet?: boolean;
    projectId?: string;
  }

  function buildCliArgs(args: MittwaldContainerUpdateCliArgs): string[] {
    const cliArgs: string[] = ['container', 'update', args.containerId];

    if (args.quiet) cliArgs.push('--quiet');
    if (args.projectId) cliArgs.push('--project-id', args.projectId);

    // Image update
    if (args.image) cliArgs.push('--image', args.image);

    // Environment variables
    if (args.env && args.env.length > 0) {
      args.env.forEach(envVar => cliArgs.push('--env', envVar));
    }

    // Environment files
    if (args.envFile && args.envFile.length > 0) {
      args.envFile.forEach(file => cliArgs.push('--env-file', file));
    }

    // Container metadata
    if (args.description) cliArgs.push('--description', args.description);
    if (args.entrypoint) cliArgs.push('--entrypoint', args.entrypoint);
    if (args.command) cliArgs.push('--command', args.command);

    // Port mappings
    if (args.publishAll) cliArgs.push('--publish-all');
    if (args.publish && args.publish.length > 0) {
      args.publish.forEach(port => cliArgs.push('--publish', port));
    }

    // Volume mounts
    if (args.volume && args.volume.length > 0) {
      args.volume.forEach(vol => cliArgs.push('--volume', vol));
    }

    // Recreate flag (applies changes immediately)
    if (args.recreate) cliArgs.push('--recreate');

    return cliArgs;
  }

  function parseQuietOutput(output: string): string | undefined {
    const trimmed = output.trim();
    if (!trimmed) return undefined;

    // Quiet mode returns container ID on last line
    const lines = trimmed.split(/\r?\n/);
    return lines.at(-1);
  }

  function mapCliError(error: CliToolError, args: MittwaldContainerUpdateCliArgs): string {
    const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

    if (combined.includes('not found') && combined.includes('container')) {
      return `Container not found: ${args.containerId}. Verify the container ID is correct.\nError: ${error.stderr || error.message}`;
    }

    if (combined.includes('image') && combined.includes('not found')) {
      return `Container image not found: ${args.image}. Verify the image name and tag are correct.\nError: ${error.stderr || error.message}`;
    }

    if (combined.includes('invalid') && combined.includes('port')) {
      return `Invalid port mapping format. Use <host-port>:<container-port> or just <container-port>.\nError: ${error.stderr || error.message}`;
    }

    if (combined.includes('invalid') && combined.includes('volume')) {
      return `Invalid volume mount format. Use <host-path>:<container-path> or <volume-name>:<container-path>.\nError: ${error.stderr || error.message}`;
    }

    if (combined.includes('permission denied') || combined.includes('forbidden')) {
      return `Permission denied. You may not have access to update this container.\nError: ${error.stderr || error.message}`;
    }

    return error.message;
  }

  export const handleContainerUpdateCli: MittwaldCliToolHandler<MittwaldContainerUpdateCliArgs> = async (args) => {
    const argv = buildCliArgs(args);

    try {
      const result = await invokeCliTool({
        toolName: 'mittwald_container_update',
        argv,
        parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
      });

      const stdout = result.result.stdout || '';
      const stderr = result.result.stderr || '';
      const output = stdout || stderr || 'Container updated successfully';

      if (args.quiet) {
        const containerId = parseQuietOutput(stdout) ?? args.containerId;
        return formatToolResponse(
          'success',
          'Container updated successfully',
          {
            containerId,
            recreated: args.recreate,
            updatedAttributes: {
              image: args.image,
              description: args.description,
              entrypoint: args.entrypoint,
              command: args.command,
              envCount: args.env?.length || 0,
              portMappings: args.publish?.length || 0,
              volumeMounts: args.volume?.length || 0,
              publishAll: args.publishAll
            },
            output
          },
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      }

      return formatToolResponse(
        'success',
        'Container update completed',
        {
          containerId: args.containerId,
          recreated: args.recreate,
          output
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    } catch (error) {
      if (error instanceof CliToolError) {
        const message = mapCliError(error, args);
        return formatToolResponse('error', message, {
          exitCode: error.exitCode,
          stderr: error.stderr,
          stdout: error.stdout,
          suggestedAction: error.suggestedAction,
        });
      }

      return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  ```

- [ ] Commit with message: `feat(container): implement container update handler`

---

### Task C2.4: Add Unit Tests

- [ ] Create file: `tests/unit/handlers/tools/mittwald-cli/container/update-cli.test.ts`
- [ ] Implement tests following existing patterns:
  ```typescript
  import { beforeEach, describe, expect, it, vi } from 'vitest';
  import { CliToolError } from '../../../../../../src/tools/error.js';
  import { handleContainerUpdateCli } from '../../../../../../src/handlers/tools/mittwald-cli/container/update-cli.js';
  import type { CliToolResult } from '../../../../../../src/tools/error.js';

  vi.mock('../../../../../../src/tools/index.js', async () => {
    const actual = await vi.importActual<typeof import('../../../../../../src/tools/index.js')>(
      '../../../../../../src/tools/index.js'
    );

    return {
      ...actual,
      invokeCliTool: vi.fn(),
    };
  });

  const { invokeCliTool } = await import('../../../../../../src/tools/index.js');
  const mockInvokeCliTool = invokeCliTool as unknown as vi.MockInstance<Promise<CliToolResult<any>>, any>;

  describe('handleContainerUpdateCli', () => {
    beforeEach(() => {
      mockInvokeCliTool.mockReset();
    });

    it('should update container image successfully', async () => {
      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: { stdout: 'Container updated', stderr: '' },
        meta: { command: 'mw container update c-abc123 --image nginx:latest', exitCode: 0, durationMs: 100 }
      });

      const result = await handleContainerUpdateCli({
        containerId: 'c-abc123',
        image: 'nginx:latest'
      });

      expect(result).toContain('success');
      expect(result).toContain('c-abc123');
    });

    it('should handle multiple environment variables', async () => {
      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: { stdout: 'Container updated', stderr: '' },
        meta: { command: 'mw container update c-abc123 --env FOO=bar --env BAZ=qux', exitCode: 0, durationMs: 100 }
      });

      const result = await handleContainerUpdateCli({
        containerId: 'c-abc123',
        env: ['FOO=bar', 'BAZ=qux']
      });

      expect(mockInvokeCliTool).toHaveBeenCalledWith(expect.objectContaining({
        argv: expect.arrayContaining(['--env', 'FOO=bar', '--env', 'BAZ=qux'])
      }));
    });

    it('should handle container not found error', async () => {
      mockInvokeCliTool.mockRejectedValueOnce(
        new CliToolError('Container not found', 1, '', 'Error: container c-invalid not found')
      );

      const result = await handleContainerUpdateCli({
        containerId: 'c-invalid',
        image: 'nginx:latest'
      });

      expect(result).toContain('error');
      expect(result).toContain('not found');
    });

    it('should parse quiet mode output', async () => {
      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: { stdout: 'c-abc123\n', stderr: '' },
        meta: { command: 'mw container update c-abc123 --quiet --image nginx:latest', exitCode: 0, durationMs: 50 }
      });

      const result = await handleContainerUpdateCli({
        containerId: 'c-abc123',
        image: 'nginx:latest',
        quiet: true
      });

      expect(result).toContain('success');
      expect(result).toContain('c-abc123');
    });

    it('should handle recreate flag', async () => {
      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: { stdout: 'Container updated and recreated', stderr: '' },
        meta: { command: 'mw container update c-abc123 --recreate', exitCode: 0, durationMs: 200 }
      });

      const result = await handleContainerUpdateCli({
        containerId: 'c-abc123',
        recreate: true
      });

      expect(mockInvokeCliTool).toHaveBeenCalledWith(expect.objectContaining({
        argv: expect.arrayContaining(['--recreate'])
      }));
    });
  });
  ```

- [ ] Run tests: `npm run test:unit -- tests/unit/handlers/tools/mittwald-cli/container/update-cli.test.ts`
- [ ] Commit with message: `test(container): add unit tests for container update`

---

### Task C2.5: Update Coverage Reports

- [ ] Run coverage generator: `npm run coverage:generate`
- [ ] Verify `container update` is now marked as covered
- [ ] Check updated stats (should be +1 covered, -1 missing)
- [ ] Commit with message: `docs(coverage): update reports after container update implementation`

---

### Task C2.6: Documentation

- [ ] Create `docs/container-update-tool.md`:
  ```markdown
  # Container Update Tool

  ## Overview
  The `mittwald_container_update` tool wraps the `mw container update` CLI command,
  allowing modification of container attributes without recreating from scratch.

  ## Use Cases

  ### 1. Update Container Image
  ```json
  {
    "name": "mittwald_container_update",
    "arguments": {
      "containerId": "c-abc123",
      "image": "nginx:1.24-alpine",
      "recreate": true
    }
  }
  ```

  ### 2. Add Environment Variables
  ```json
  {
    "name": "mittwald_container_update",
    "arguments": {
      "containerId": "c-abc123",
      "env": [
        "DEBUG=true",
        "LOG_LEVEL=info"
      ]
    }
  }
  ```

  ### 3. Update Port Mappings
  ```json
  {
    "name": "mittwald_container_update",
    "arguments": {
      "containerId": "c-abc123",
      "publish": [
        "8080:80",
        "8443:443"
      ]
    }
  }
  ```

  ### 4. Mount Additional Volumes
  ```json
  {
    "name": "mittwald_container_update",
    "arguments": {
      "containerId": "c-abc123",
      "volume": [
        "my-data-volume:/var/lib/data"
      ]
    }
  }
  ```

  ## Important Notes

  - **Recreate Flag**: Changes to image, entrypoint, command, or certain runtime parameters
    may require `recreate: true` to take effect immediately
  - **Multiple Updates**: All specified attributes can be updated in a single call
  - **Quiet Mode**: Returns only the container ID for programmatic use
  - **Validation**: CLI validates port mappings, volume formats, and environment variables

  ## Error Handling

  Common errors and their meanings:
  - **Container not found**: Invalid container ID or insufficient permissions
  - **Image not found**: Invalid image name or tag
  - **Invalid port mapping**: Use `<host>:<container>` or `<port>` format
  - **Invalid volume**: Use `<source>:<destination>` format
  - **Permission denied**: Insufficient access to the container or project
  ```

- [ ] Add link to `docs/INDEX.md`
- [ ] Commit with message: `docs(container): add container update tool documentation`

---

### Task C2.7: Verification & Testing

- [ ] Build project: `npm run build`
- [ ] Run type checking: `npm run type-check`
- [ ] Run all container tests: `npm run test:unit -- tests/unit/handlers/tools/mittwald-cli/container`
- [ ] Verify tool scanner discovers the new tool
- [ ] Commit with message: `test(container): verify container update tool integration`

---

## Critical Guidelines

### Git Workflow
- ✅ **Commit after EACH task** (7 commits expected)
- ✅ **Use conventional commit format**: `feat(container):`, `docs(container):`, `test(container):`
- ❌ **DO NOT rebase** - keep linear history
- ❌ **DO NOT squash commits**
- ✅ **Push after every 2-3 commits**

### Code Quality
- Follow the exact pattern from `container/recreate-cli.ts`
- Support **multiple values** for env, envFile, publish, volume (arrays)
- Validate container ID format if possible
- Use comprehensive error mapping (5+ error cases)
- Handle quiet mode with proper output parsing

### Pattern Consistency
This tool should match:
- **Schema**: Similar to `container/recreate-cli.ts` (multiple optional parameters)
- **Handler**: Similar to `container/delete-cli.ts` (error mapping + quiet mode)
- **Tests**: Similar to other container tools (mock patterns, error cases)

### When to Ask for Help
- ❓ Unclear how to handle array parameters (env, publish, volume)
- ❓ Quiet mode output format is unexpected
- ❓ CLI arguments ordering matters (it usually doesn't, but verify)
- ❓ Error mapping needs more context
- ❓ **ANY time you're blocked for >20 minutes**

## Success Criteria
- [x] Tool definition created with comprehensive schema
- [x] Handler implements all CLI flags correctly
- [x] Array parameters (env, publish, volume) handled properly
- [x] Quiet mode parsing extracts container ID
- [x] Error mapping covers 5+ error cases
- [x] Unit tests pass (5+ test cases)
- [x] Build succeeds
- [x] Coverage reports updated (+1 covered)
- [x] Documentation complete
- [x] All commits follow conventional format

## Dependencies
**Blocking**: None - can start immediately
**Recommended**: Complete after C1 (app dependencies) for consistent progress

## Estimated Effort
**1 day** (straightforward tool implementation, single command)

---

**Remember**: `container update` is powerful - users can modify multiple attributes at once. Make sure the schema documents all options clearly, and error messages guide users toward correct formats.

You've got this! 🎯
