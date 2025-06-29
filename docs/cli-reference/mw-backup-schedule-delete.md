# mw backup schedule delete

```
$ mw backup schedule delete --help
Delete a backup schedule

USAGE
  $ mw backup schedule delete BACKUP-SCHEDULE-ID [-q] [-f]

ARGUMENTS
  BACKUP-SCHEDULE-ID  ID of schedule to delete

FLAGS
  -f, --force  Do not ask for confirmation
  -q, --quiet  suppress process output and only display a machine-readable
               summary.

DESCRIPTION
  Delete a backup schedule

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

```
