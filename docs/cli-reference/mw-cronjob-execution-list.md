# mw cronjob execution list

```
$ mw cronjob execution list --help
List CronjobExecutions belonging to a Cronjob.

USAGE
  $ mw cronjob execution list -o txt|json|yaml|csv|tsv --cronjob-id <value> [-x]
    [--no-header] [--no-truncate] [--no-relative-dates] [--csv-separator ,|;]

FLAGS
  -o, --output=<option>         (required) [default: txt] output in a more
                                machine friendly format
                                <options: txt|json|yaml|csv|tsv>
  -x, --extended                show extended information
      --cronjob-id=<value>      (required) ID of the cron job for which to list
                                executions for.
      --csv-separator=<option>  [default: ,] separator for CSV output (only
                                relevant for CSV output)
                                <options: ,|;>
      --no-header               hide table header
      --no-relative-dates       show dates in absolute format, not relative
                                (only relevant for txt output)
      --no-truncate             do not truncate output (only relevant for txt
                                output)

DESCRIPTION
  List CronjobExecutions belonging to a Cronjob.

ALIASES
  $ mw project cronjob execution list

```
