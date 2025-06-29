# mw cronjob execute

```
$ mw cronjob execute --help
Manually run a cron job

USAGE
  $ mw cronjob execute CRONJOB-ID [-q]

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
