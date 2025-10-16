# Registry Tool Rename (October 2025)

## Breaking Changes

The following tools have been renamed to align with the Mittwald CLI taxonomy (`registry` topic):

| Old Name | New Name |
| --- | --- |
| mittwald_container_registry_create | mittwald_registry_create |
| mittwald_container_registry_delete | mittwald_registry_delete |
| mittwald_container_registry_list | mittwald_registry_list |
| mittwald_container_registry_update | mittwald_registry_update |

## Migration Guidance

- Update any MCP client integrations to reference the new tool names.
- Ensure handler imports use `src/handlers/tools/mittwald-cli/registry/*`.
- Remove legacy references to the `container/registry-*` files; they have been deleted.
- Regenerate CLI coverage artifacts (`npm run coverage:generate`) to confirm the `registry` topic is marked as covered.

## Versioning Notes

This rename is a breaking change for clients depending on the legacy tool identifiers. Plan a major version bump when publishing the MCP server with this change.
