# Registry Tool Audit (2025-10-02)

The current registry-related MCP tools still live under the legacy `container` taxonomy. This audit captures their tool names and source locations before refactoring.

## Tool Checklist

- [x] `mittwald_container_registry_create`
  - Tool definition: `src/constants/tool/mittwald-cli/container/registry-create-cli.ts`
  - Handler: `src/handlers/tools/mittwald-cli/container/registry-create-cli.ts`
- [x] `mittwald_container_registry_delete`
  - Tool definition: `src/constants/tool/mittwald-cli/container/registry-delete-cli.ts`
  - Handler: `src/handlers/tools/mittwald-cli/container/registry-delete-cli.ts`
- [x] `mittwald_container_registry_list`
  - Tool definition: `src/constants/tool/mittwald-cli/container/registry-list-cli.ts`
  - Handler: `src/handlers/tools/mittwald-cli/container/registry-list-cli.ts`
- [x] `mittwald_container_registry_update`
  - Tool definition: `src/constants/tool/mittwald-cli/container/registry-update-cli.ts`
  - Handler: `src/handlers/tools/mittwald-cli/container/registry-update-cli.ts`

## Notes

- All four tools are discovered under the `container` namespace, leading to a mismatch with the CLI's `registry` topic.
- Handler implementations already invoke the CLI using the `registry` command group; only tooling taxonomy and metadata require updates.
