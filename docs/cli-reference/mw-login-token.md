# mw login token (Not Available via MCP)

> **⚠️ Note**: This command is not available through the Mittwald MCP Server for security and multi-tenancy reasons. Authentication should be handled through environment variables only.

```
$ mw login token --help
Authenticate using an API token

USAGE
  $ mw login token [-q] [-o]

FLAGS
  -o, --overwrite  overwrite existing token file
  -q, --quiet      suppress process output and only display a machine-readable
                   summary.

DESCRIPTION
  Authenticate using an API token

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

```
