# mw ssh-user update

```
$ mw ssh-user update --help
Update an existing SSH user

USAGE
  $ mw ssh-user update SSH-USER-ID [-q] [--expires <value>] [--description
    <value>] [--public-key <value>] [--password <value>] [--enable | --disable]

ARGUMENTS
  SSH-USER-ID  The ID of the SSH user to update

FLAGS
  -q, --quiet                suppress process output and only display a
                             machine-readable summary.
      --description=<value>  Set description for SSH user.
      --disable              Disable the SSH user.
      --enable               Enable the SSH user.
      --expires=<value>      an interval after which the SSH user expires
                             (examples: 30m, 30d, 1y).
      --password=<value>     Password used for authentication
      --public-key=<value>   Public key used for authentication

DESCRIPTION
  Update an existing SSH user

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

  --description=<value>  Set description for SSH user.

    Set the description for the given SSH user, which will be displayed in the
    mStudio as well as with the list command.

  --disable  Disable the SSH user.

    Set the status of the SSH user to inactive. Access by this user will be
    disabled.

  --enable  Enable the SSH user.

    Set the status of the SSH user to active. Access by this user will be
    enabled.

  --password=<value>  Password used for authentication

    Specify an authentication password. Using a password for authentication
    prevents this user from also using a public key for authentication.

  --public-key=<value>  Public key used for authentication

    Specifies the public key to use for authentication. The corresponding
    private key is required locally to connect through this user. Using a public
    key for authentication prevents this user from also using a password for
    authentication.

```
