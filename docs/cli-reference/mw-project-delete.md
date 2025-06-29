# mw project delete

```
$ mw project delete --help
Delete a project

USAGE
  $ mw project delete [PROJECT-ID] [-q] [-f]

ARGUMENTS
  PROJECT-ID  ID or short ID of a project; this argument is optional if a
              default project is set in the context.

FLAGS
  -f, --force  Do not ask for confirmation
  -q, --quiet  suppress process output and only display a machine-readable
               summary.

DESCRIPTION
  Delete a project

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

```
