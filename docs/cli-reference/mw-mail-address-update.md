# mw mail address update

```
$ mw mail address update --help
Update a mail address

USAGE
  $ mw mail address update MAILADDRESS-ID [-q] [-a <value>] [--catch-all]
    [--quota <value>] [--password <value>] [--random-password] [--forward-to
    <value>...]

ARGUMENTS
  MAILADDRESS-ID  ID or mail address of a mailaddress

FLAGS
  -a, --address=<value>        mail address
  -q, --quiet                  suppress process output and only display a
                               machine-readable summary.
      --[no-]catch-all         Change this from or to a catch-all mail address;
                               omit to leave unchanged
      --forward-to=<value>...  forward mail to other addresses
      --password=<value>       mailbox password
      --quota=<value>          mailbox quota in mebibytes
      --random-password        generate a random password

DESCRIPTION
  Update a mail address

  This command can be used to update a mail address in a project.

  A mail address is either associated with a mailbox, or forwards to another
  address.

  To set forwarding addresses, use the --forward-to flag.

  Use the --catch-all flag to make the mailbox a catch-all mailbox.
  Use the --no-catch-all flag to make the mailbox a regular mailbox.

  When running this command with --generated-password the output will be the
  newly generated and set password.

EXAMPLES
  Update non-interactively with password

    $ read -s PASSWORD && \
      mw mail address update --password $PASSWORD --address foo@bar.example

  Update non-interactively with random password

    $ mw mail address update --random-password --address foo@bar.example

  Set forwarding addresses

    $ mw mail address update --address foo@bar.example --forward-to \
      bar@bar.example --forward-to baz@bar.example

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

  --forward-to=<value>...  forward mail to other addresses

    This flag will cause the mailbox to forward all incoming mail to the given
    addresses. This will replace any forwarding addresses, that have already
    been set.

    Note: This flag is exclusive with --catch-all, --no-catch-all, --quota,
    --password and --random-password.

  --password=<value>  mailbox password

    If set, the mailbox will be updated to this password. If omitted, the
    password will remain unchanged.

    CAUTION: providing this flag may log your password in your shell history!

  --random-password  generate a random password

    This flag will cause the command to generate a random 32-character password
    for the mailbox; when running with --quiet, the password will be printed to
    stdout.

```
