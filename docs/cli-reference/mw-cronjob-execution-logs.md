# mw cronjob execution logs

```
$ mw cronjob execution logs --help
Get the log output of a cronjob execution.

USAGE
  $ mw cronjob execution logs CRONJOB-ID EXECUTION-ID -o txt|json|yaml
  [--no-pager]

ARGUMENTS
  CRONJOB-ID    ID of the cronjob the execution belongs to
  EXECUTION-ID  ID of the cronjob execution to be retrieved.

FLAGS
  -o, --output=<option>  (required) [default: txt] output in a more machine
                         friendly format
                         <options: txt|json|yaml>
      --no-pager         Disable pager for output.

DESCRIPTION
  Get the log output of a cronjob execution.

  This command prints the log output of a cronjob execution. When this command
  is run in a terminal, the output is piped through a pager. The pager is
  determined by your PAGER environment variable, with defaulting to "less". You
  can disable this behavior with the --no-pager flag.

ALIASES
  $ mw project cronjob execution logs

```
