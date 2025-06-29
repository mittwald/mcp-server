# mw cronjob delete

```
$ mw cronjob delete --help
Delete a cron job

USAGE
  $ mw cronjob delete CRONJOB-ID [-q] [-f]

ARGUMENTS
  CRONJOB-ID  ID of the cronjob to be deleted.

FLAGS
  -f, --force  Do not ask for confirmation
  -q, --quiet  suppress process output and only display a machine-readable
               summary.

DESCRIPTION
  Delete a cron job

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

```
