# mw backup create

```
$ mw backup create --help
Create a new backup of a project

USAGE
  $ mw backup create --expires <value> [-q] [-p <value>] [--description
    <value>] [-w] [--wait-timeout <value>]

FLAGS
  -p, --project-id=<value>    ID or short ID of a project; this flag is optional
                              if a default project is set in the context
  -q, --quiet                 suppress process output and only display a
                              machine-readable summary.
  -w, --wait                  wait for the resource to be ready.
      --description=<value>   a description for the backup.
      --expires=<value>       (required) an interval after which the backup
                              expires (examples: 30m, 30d, 1y).
      --wait-timeout=<value>  [default: 600s] the duration to wait for the
                              resource to be ready (common units like 'ms', 's',
                              'm' are accepted).

ALIASES
  $ mw project backup create

FLAG DESCRIPTIONS
  -p, --project-id=<value>

    ID or short ID of a project; this flag is optional if a default project is
    set in the context

    May contain a short ID or a full ID of a project; you can also use the "mw
    context set --project-id=<VALUE>" command to persistently set a default
    project for all commands that accept this flag.

  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

```
