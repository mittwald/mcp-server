# mw cronjob update

```
$ mw cronjob update --help
Update an existing cron job

USAGE
  $ mw cronjob update CRONJOB-ID [-q] [--description <value>] [--interval
    <value>] [--email <value>] [--url <value> | --command <value>]
    [--interpreter bash|php ] [--enable | --disable] [--timeout <value>]

ARGUMENTS
  CRONJOB-ID  ID of the cron job to be updated.

FLAGS
  -q, --quiet                 suppress process output and only display a
                              machine-readable summary.
      --command=<value>       Specify the file and arguments to be executed when
                              the cron job is run.
      --description=<value>   Set cron job description.
      --disable               Disable the cron job.
      --email=<value>         Set the target email to which error messages will
                              be sent.
      --enable                Enable the cron job.
      --interpreter=<option>  Set the interpreter to be used for execution.
                              <options: bash|php>
      --interval=<value>      Set the interval for cron jobs to run.
      --timeout=<value>       Timeout after which the process will be killed.
      --url=<value>           Set the URL to use when running a cron job.

DESCRIPTION
  Update an existing cron job

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

  --command=<value>

    Specify the file and arguments to be executed when the cron job is run.

    Specifies a file to be executed with the specified interpreter. Additional
    arguments can be appended to the command to be passed to the script. Not
    required if a URL is given.

  --description=<value>  Set cron job description.

    This will be displayed as the cron jobs 'name' of the cron job in mStudio.

  --disable  Disable the cron job.

    Set the status of the cron job to active. Automatic execution will be
    enabled.

  --email=<value>  Set the target email to which error messages will be sent.

    If a cron job fails, a detailed error message will be sent to this email
    address.

  --enable  Enable the cron job.

    Set the status of the cron job to inactive. Automatic execution will be
    disabled.

  --interpreter=bash|php  Set the interpreter to be used for execution.

    Must be either 'bash' or 'php'. Define the interpreter to be used to execute
    the previously defined command. The interpreter should match the
    corresponding command or script.

  --interval=<value>  Set the interval for cron jobs to run.

    Must be specified as a cron schedule expression. Defines the interval at
    which the cron job will be executed.

  --timeout=<value>  Timeout after which the process will be killed.

    Common duration formats are supported (for example, '1h', '30m', '30s').
    Defines the amount of time after which a running cron job will be killed. If
    an email address is defined, an error message will be sent.

  --url=<value>  Set the URL to use when running a cron job.

    Define a URL with protocol to which a request will be dispatched when the
    cron job is executed. For example: 'https://my-website.com/cron-job'. Not
    required if a command and interpreter is defined.

```
