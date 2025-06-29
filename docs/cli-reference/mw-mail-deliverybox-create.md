# mw mail deliverybox create

```
$ mw mail deliverybox create --help
Create a new mail delivery box

USAGE
  $ mw mail deliverybox create -d <value> [-p <value>] [-q] [--password <value> |
    --random-password]

FLAGS
  -d, --description=<value>  (required) mail delivery box description
  -p, --project-id=<value>   ID or short ID of a project; this flag is optional
                             if a default project is set in the context
  -q, --quiet                suppress process output and only display a
                             machine-readable summary.
      --password=<value>     delivery box password
      --random-password      generate a random password

DESCRIPTION
  Create a new mail delivery box

  This command can be used to create a new mail delivery box in a project.

  When running this command with the --quiet flag, the output will contain the
  ID of the newly created delivery box.
  In addition, when run with --generated-password the output will be the ID of
  the newly created delivery box, followed by a tab character and the generated
  password.

EXAMPLES
  Create non-interactively with password

    $ read -s PASSWORD && \
      mw mail deliverybox create --password $PASSWORD --description 'my \
      personal delivery box'

  Create non-interactively with random password

    $ mw mail deliverybox create --random-password --description 'my \
      personal delivery box'

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

  --password=<value>  delivery box password

    This is the password that should be used for the delivery box; if omitted,
    the command will prompt interactively for a password.

    CAUTION: providing this flag may log your password in your shell history!

  --random-password  generate a random password

    This flag will cause the command to generate a random 32-character password
    for the delivery box; when running with --quiet, the delivery box ID and the
    password will be printed to stdout, separated by a tab character.

```
