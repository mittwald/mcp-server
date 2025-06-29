# mw backup schedule create

```
$ mw backup schedule create --help
Create a new backup schedule

USAGE
  $ mw backup schedule create --schedule <value> --ttl <value> [-p <value>] [-q]
    [--description <value>]

FLAGS
  -p, --project-id=<value>   ID or short ID of a project; this flag is optional
                             if a default project is set in the context
  -q, --quiet                suppress process output and only display a
                             machine-readable summary.
      --description=<value>  Set the description for the backup schedule.
      --schedule=<value>     (required) Set the interval at which the backup
                             should be scheduled.
      --ttl=<value>          (required) Define the backup retention period in
                             days for backups created.

FLAG DESCRIPTIONS
  -p, --project-id=<value>

    ID or short ID of a project; this flag is optional if a default project is
    set in the context

    May contain a short ID or a full ID of a project; you can also use the "mw
    context set --project-id=<VALUE>" command to persistently set a default
    project for all commands that accept this flag.

  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

  --description=<value>  Set the description for the backup schedule.

    Set the description for the given backup schedule to be displayed in mStudio
    and with the list command.

  --schedule=<value>  Set the interval at which the backup should be scheduled.

    Must be specified as a cron schedule expression. Cannot be scheduled more
    often than once per hour. Defines the interval at which the backup creation
    will be executed.

  --ttl=<value>  Define the backup retention period in days for backups created.

    Must be specified as an amount of days between 7 and 400 in the format
    [amount]d - e.g. '7d' for 7 days. This will define the number of days the
    backup will be kept.

```
