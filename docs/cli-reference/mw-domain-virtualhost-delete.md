# mw domain virtualhost delete

```
$ mw domain virtualhost delete --help
Delete a virtual host

USAGE
  $ mw domain virtualhost delete VIRTUAL-HOST-ID [-q] [-f]

ARGUMENTS
  VIRTUAL-HOST-ID  ID of the virtual host to delete

FLAGS
  -f, --force  Do not ask for confirmation
  -q, --quiet  suppress process output and only display a machine-readable
               summary.

DESCRIPTION
  Delete a virtual host

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

```
