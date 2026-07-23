# Known Limitations

`src/constants/tool/mittwald-cli/**` contains 161 tool definitions. 45 of them are excluded by
`EXCLUDED_TOOLS_WITH_REASONS` in `src/utils/tool-scanner.ts`, leaving **116 tools registered**.
That map is the source of truth; this page explains the categories behind it.

## Not Yet Migrated to the Library (32 tools)

These still shell out to `mw`. To keep the server free of subprocess spawning under concurrent
load, they are not registered. Removing an exclusion means porting the logic into
`packages/mittwald-cli-core/src/resources/` first.

| Group | Tools |
|-------|-------|
| App installers | `app_install_wordpress`, `_typo3`, `_shopware5`, `_shopware6`, `_joomla`, `_matomo`, `_nextcloud`, `_contao` |
| App creation | `app_create_node`, `_php`, `_php_worker`, `_python`, `_static` |
| App dependencies | `app_dependency_list`, `_update`, `_versions` |
| Marketplace extensions | `extension_install`, `extension_list`, `extension_list_installed`, `extension_uninstall` |
| "Own" membership lookups | `project_invite_list_own`, `project_membership_get_own`, `project_membership_list_own`, `org_invite_list_own`, `org_membership_list_own` |
| Containers | `container_recreate`, `container_update` |
| SFTP users | `sftp_user_create`, `_update`, `_delete`, `_list` — the library lacks the `expires`/`publicKey` parameters the CLI supports |
| Other | `project_filesystem_usage`, `volume_delete` (CLI-side safety checks) |

Five registered tools do still spawn `mw`: `container_start`, `container_stop`,
`container_restart`, `container_delete` and `volume_create`.

## No API Support (3 tools)

| Tool | Reason |
|------|--------|
| `cronjob_execution_logs` | No API endpoint for execution logs |
| `database_mysql_charsets` | Requires a direct MySQL connection |
| `database_list` | CLI-only wrapper with no direct API equivalent |

## Admin-Only Endpoints (6 tools)

All `conversation_*` tools (`categories`, `close`, `create`, `list`, `reply`, `show`) return
HTTP 403 with any OAuth token. Mittwald publishes no conversation scope — these are internal
support endpoints. There is no workaround.

## Incompatible with a Stateless MCP Server (2 tools)

| Tool | Reason |
|------|--------|
| `container_run` | Arbitrary interactive command execution |
| `ddev_render_config` | Local development helper; meaningless on the server |

Note that SSH, MySQL port-forwarding, dumps, imports, phpMyAdmin and backup downloads are **not**
excluded. Those tools resolve the connection data via the API and return a ready-to-run command or
URL for the agent to use locally — see "Return Connection Data, Don't Execute" in `CLAUDE.md`.

## Deliberately Withheld (1 tool)

`org_delete` is irreversible and there is no `org_create` counterpart, so it is excluded rather
than guarded.

## Permission-Dependent Behaviour

Several registered tools succeed or fail purely on the caller's Mittwald role, and will return
HTTP 403 for members without the required rights. This is correct API behaviour, not a server
defect. It affects, among others: `org_invite_revoke`, `org_membership_revoke`, `project_delete`,
`project_invite_list` and `project_membership_list` (Owner/Admin role required), and any tool
addressing a project the user cannot access.
