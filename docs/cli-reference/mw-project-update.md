# mw project update

```
$ mw project update --help
Update an existing project

USAGE
  $ mw project update [PROJECT-ID] [-q] [-p <value>] [--description <value>]

ARGUMENTS
  PROJECT-ID  ID or short ID of a project; this argument is optional if a
              default project is set in the context.

FLAGS
  -p, --project-id=<value>   ID or short ID of a project; this flag is optional
                             if a default project is set in the context
  -q, --quiet                suppress process output and only display a
                             machine-readable summary.
      --description=<value>  Set the project description

DESCRIPTION
  Update an existing project

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
