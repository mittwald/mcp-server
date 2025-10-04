# Stack Tool Audit (October 2025)

The Mittwald MCP server currently exposes the following stack-related tools under the `container` taxonomy. This audit captures their existing names and file locations before the rename to the top-level `stack` topic.

- [x] `mittwald_container_stack_delete`
  - constant: `src/constants/tool/mittwald-cli/container/stack-delete-cli.ts`
  - handler: `src/handlers/tools/mittwald-cli/container/stack-delete-cli.ts`
- [x] `mittwald_container_stack_deploy`
  - constant: `src/constants/tool/mittwald-cli/container/stack-deploy-cli.ts`
  - handler: `src/handlers/tools/mittwald-cli/container/stack-deploy-cli.ts`
- [x] `mittwald_container_stack_list`
  - constant: `src/constants/tool/mittwald-cli/container/stack-list-cli.ts`
  - handler: `src/handlers/tools/mittwald-cli/container/stack-list-cli.ts`
- [x] `mittwald_container_stack_ps`
  - constant: `src/constants/tool/mittwald-cli/container/stack-ps-cli.ts`
  - handler: `src/handlers/tools/mittwald-cli/container/stack-ps-cli.ts`

These tool names currently diverge from the CLI v1.11.2 taxonomy (`stack *`). Follow-up tasks will realign the directory layout and tool identifiers while keeping handler logic intact.
