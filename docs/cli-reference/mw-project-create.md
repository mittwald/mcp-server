# mw project create

```
$ mw project create --help
Create a new project

USAGE
  $ mw project create -d <value> [-s <value>] [-q] [-w] [--wait-timeout
    <value>] [--update-context]

FLAGS
  -d, --description=<value>   (required) A description for the project.
  -q, --quiet                 suppress process output and only display a
                              machine-readable summary.
  -s, --server-id=<value>     ID or short ID of a server; this flag is optional
                              if a default server is set in the context
  -w, --wait                  wait for the resource to be ready.
      --update-context        Update the CLI context to use the newly created
                              project
      --wait-timeout=<value>  [default: 600s] the duration to wait for the
                              resource to be ready (common units like 'ms', 's',
                              'm' are accepted).

DESCRIPTION
  Create a new project

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

  -s, --server-id=<value>

    ID or short ID of a server; this flag is optional if a default server is set
    in the context

    May contain a short ID or a full ID of a server; you can also use the "mw
    context set --server-id=<VALUE>" command to persistently set a default
    server for all commands that accept this flag.

```
