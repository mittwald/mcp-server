# mw cronjob execution get

```
$ mw cronjob execution get --help
Get a cron job execution.

USAGE
  $ mw cronjob execution get CRONJOB-ID EXECUTION-ID -o txt|json|yaml

ARGUMENTS
  CRONJOB-ID    ID of the cronjob the execution belongs to
  EXECUTION-ID  ID of the cronjob execution to be retrieved.

FLAGS
  -o, --output=<option>  (required) [default: txt] output in a more machine
                         friendly format
                         <options: txt|json|yaml>

DESCRIPTION
  Get a cron job execution.

ALIASES
  $ mw project cronjob execution get

```
