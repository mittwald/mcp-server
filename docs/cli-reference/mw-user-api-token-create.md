# mw user api-token create

```
$ mw user api-token create --help
Create a new API token

USAGE
  $ mw user api-token create --description <value> --roles api_read|api_write...
    [-q] [--expires <value>]

FLAGS
  -q, --quiet                suppress process output and only display a
                             machine-readable summary.
      --description=<value>  (required) description of the API token
      --expires=<value>      an interval after which the API token expires
                             (examples: 30m, 30d, 1y).
      --roles=<option>...    (required) roles of the API token
                             <options: api_read|api_write>

DESCRIPTION
  Create a new API token

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

```
