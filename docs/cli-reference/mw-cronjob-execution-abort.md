# mw cronjob execution abort

```
$ mw cronjob execution abort --help
Abort a running cron job execution.

USAGE
  $ mw cronjob execution abort CRONJOB-ID EXECUTION-ID [-q]

ARGUMENTS
  CRONJOB-ID    ID of the cronjob the execution belongs to
  EXECUTION-ID  ID of the cron job execution to abort

FLAGS
  -q, --quiet  suppress process output and only display a machine-readable
               summary.

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

```
