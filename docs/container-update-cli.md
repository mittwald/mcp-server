# Mittwald CLI – Container Update

The `mw container update` command updates configuration for an existing container without deleting it. It can modify runtime configuration such as image, environment, networking, and volumes, and optionally recreate the container to apply changes immediately.

## Command Synopsis

```bash
mw container update CONTAINER-ID \
  [--image <value>] \
  [--env <KEY=VALUE>...] \
  [--env-file <path>...] \
  [--description <value>] \
  [--entrypoint <value>] \
  [--command <value>] \
  [--publish <mapping>...] [--publish-all] \
  [--volume <mapping>...] \
  [--recreate] \
  [--project-id <value>] \
  [--quiet]
```

`CONTAINER-ID` accepts either the full or short identifier of the container. The command inherits project context from the current session, but `--project-id` can override it.

## Flag Reference

| Flag | Alias | Description |
| --- | --- | --- |
| `--image <value>` | – | Replace the container image (e.g., `nginx:1.25-alpine`). |
| `--env <value>` | `-e` | Add or update environment variables in `KEY=VALUE` format. Repeat the flag to set multiple values. |
| `--env-file <path>` | – | Load environment variables from one or more files (one `KEY=VALUE` per line). |
| `--description <value>` | – | Update the descriptive label shown for the container. |
| `--entrypoint <value>` | – | Override the image entrypoint. |
| `--command <value>` | – | Replace the default command executed inside the container. |
| `--publish <mapping>` | `-p` | Configure explicit port mappings using `<host-port>:<container-port>` or `<container-port>`. Repeat for multiple mappings. |
| `--publish-all` | `-P` | Publish every port exposed by the image to an ephemeral host port. |
| `--volume <mapping>` | `-v` | Mount paths or named volumes in `<source>:<destination>` format. Repeat for multiple mounts. |
| `--recreate` | – | Recreate the container after updating to apply image or runtime changes immediately. |
| `--project-id <value>` | `-p` | Target a specific project when the session context is unset or needs overriding. |
| `--quiet` | `-q` | Suppress CLI progress output; only the container ID is printed on success. |

## Behavioral Notes

- Updates are additive: multiple attributes can be changed in a single invocation.
- Quiet mode prints the container ID on the final line, enabling scripting and MCP tool parsing.
- The command validates port mappings and volume formats, failing early on malformed values.
- Using `--recreate` is recommended when changing image, entrypoint, or command to ensure the new configuration takes effect immediately.
- Authentication uses the session token supplied via `--token` when run under the MCP server; manual usage requires a Mittwald CLI login or explicit token.
