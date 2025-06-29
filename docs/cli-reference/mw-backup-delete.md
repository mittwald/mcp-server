# mw backup delete

```
$ mw backup delete --help
Delete a backup

USAGE
  $ mw backup delete BACKUP-ID [-q] [-f]

ARGUMENTS
  BACKUP-ID  ID or short ID of a backup.

FLAGS
  -f, --force  Do not ask for confirmation
  -q, --quiet  suppress process output and only display a machine-readable
               summary.

DESCRIPTION
  Delete a backup

ALIASES
  $ mw project backup delete

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

```
