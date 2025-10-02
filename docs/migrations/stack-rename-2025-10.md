# Stack Tool Rename (October 2025)

## Breaking Changes
The following tools have been renamed to align with the Mittwald CLI v1.11.2 taxonomy:

| Old Name | New Name |
|----------|----------|
| mittwald_container_stack_delete | mittwald_stack_delete |
| mittwald_container_stack_deploy | mittwald_stack_deploy |
| mittwald_container_stack_list | mittwald_stack_list |
| mittwald_container_stack_ps | mittwald_stack_ps |

## Migration Path
Update any MCP client integrations to use the new `mittwald_stack_*` tool names. The old identifiers are no longer exported as of this release.

## Notes
- Stack handlers continue to execute `mw stack …` subcommands; only tool identifiers and file locations changed.
- Coverage reports were regenerated to reflect the new taxonomy.
- Coordinate rollout with the registry rename to ensure a consistent breaking release.
