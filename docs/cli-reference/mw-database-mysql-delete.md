# mw database mysql delete

```
$ mw database mysql delete --help
Delete a MySQL database

USAGE
  $ mw database mysql delete DATABASE-ID [-q] [-f]

ARGUMENTS
  DATABASE-ID  The ID or name of the database

FLAGS
  -f, --force  Do not ask for confirmation
  -q, --quiet  suppress process output and only display a machine-readable
               summary.

DESCRIPTION
  Delete a MySQL database

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

```
