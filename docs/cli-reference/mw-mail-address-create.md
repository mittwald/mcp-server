# mw mail address create

```
$ mw mail address create --help
Create a new mail address

USAGE
  $ mw mail address create -a <value> [-p <value>] [-q] [--catch-all]
    [--enable-spam-protection] [--quota <value>] [--password <value> |
    --random-password] [--forward-to <value>...]

FLAGS
  -a, --address=<value>              (required) mail address
  -p, --project-id=<value>           ID or short ID of a project; this flag is
                                     optional if a default project is set in the
                                     context
  -q, --quiet                        suppress process output and only display a
                                     machine-readable summary.
      --catch-all                    make this a catch-all mail address
      --[no-]enable-spam-protection  enable spam protection for this mailbox
      --forward-to=<value>...        forward mail to other addresses
      --password=<value>             mailbox password
      --quota=<value>                [default: 1GiB] mailbox quota
      --random-password              generate a random password

DESCRIPTION
  Create a new mail address

  This command can be used to create a new mail address in a project.

  A mail address is either associated with a mailbox, or forwards to another
  address.

  To create a forwarding address, use the --forward-to flag. This flag can be
  used multiple times to forward to multiple addresses.

  When no --forward-to flag is given, the command will create a mailbox for the
  address. In this case, the --catch-all flag can be used to make the mailbox a
  catch-all mailbox.

  When running this command with the --quiet flag, the output will contain the
  ID of the newly created address.
  In addition, when run with --generated-password the output will be the ID of
  the newly created address, followed by a tab character and the generated
  password.

EXAMPLES
  Create non-interactively with password

    $ read -s PASSWORD && \
      mw mail address create --password $PASSWORD --address foo@bar.example

  Create non-interactively with random password

    $ mw mail address create --random-password --address foo@bar.example

  Create a forwarding address

    $ mw mail address create --address foo@bar.example --forward-to \
      bar@bar.example --forward-to baz@bar.example

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

  --forward-to=<value>...  forward mail to other addresses

    This flag will cause the mailbox to forward all incoming mail to the given
    addresses. This will replace any forwarding addresses, that have already
    been set.

    Note: This flag is exclusive with --catch-all, --quota, --password and
    --random-password.

  --password=<value>  mailbox password

    This is the password that should be used for the mailbox; if omitted, the
    command will prompt interactively for a password.

    CAUTION: providing this flag may log your password in your shell history!

  --random-password  generate a random password

    This flag will cause the command to generate a random 32-character password
    for the mailbox; when running with --quiet, the address ID and the password
    will be printed to stdout, separated by a tab character.

```
