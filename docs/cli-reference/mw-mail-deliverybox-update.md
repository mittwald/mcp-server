# mw mail deliverybox update

```
$ mw mail deliverybox update --help
Update a mail delivery box

USAGE
  $ mw mail deliverybox update MAILDELIVERYBOX-ID [-q] [--description <value>]
    [--password <value>] [--random-password]

ARGUMENTS
  MAILDELIVERYBOX-ID  ID or short ID of a maildeliverybox.

FLAGS
  -q, --quiet                suppress process output and only display a
                             machine-readable summary.
      --description=<value>  delivery box description
      --password=<value>     delivery box password
      --random-password      generate a random password

DESCRIPTION
  Update a mail delivery box

  This command can be used to update a mail delivery box in a project.

  A mail delivery box is either associated with a mailbox, or forwards to
  another address.

  When running this command with --generated-password the output will be the
  newly generated and set password.

EXAMPLES
  Update non-interactively with password

    $ read -s PASSWORD && \
      mw mail deliverybox update --password $PASSWORD --description 'my \
      personal delivery box'

  Update non-interactively with random password

    $ mw mail deliverybox update --random-password --description 'my \
      personal delivery box'

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

  --description=<value>  delivery box description

    If set, the delivery description will be updated to this password. If
    omitted, the description will remain unchanged.

  --password=<value>  delivery box password

    If set, the delivery box will be updated to this password. If omitted, the
    password will remain unchanged.

    CAUTION: providing this flag may log your password in your shell history!

  --random-password  generate a random password

    This flag will cause the command to generate a random 32-character password
    for the delivery box; when running with --quiet, the password will be
    printed to stdout.

```
