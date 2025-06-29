# mw ssh-user create

```
$ mw ssh-user create --help
Create a new SSH user

USAGE
  $ mw ssh-user create --description <value> [-p <value>] [-q] [--expires
    <value>] [--public-key <value>] [--password <value>]

FLAGS
  -p, --project-id=<value>   ID or short ID of a project; this flag is optional
                             if a default project is set in the context
  -q, --quiet                suppress process output and only display a
                             machine-readable summary.
      --description=<value>  (required) Set description for SSH user.
      --expires=<value>      an interval after which the SSH user expires
                             (examples: 30m, 30d, 1y).
      --password=<value>     Password used for authentication
      --public-key=<value>   Public key used for authentication

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

  --description=<value>  Set description for SSH user.

    Set the description for the given SSH user, which will be displayed in the
    mStudio as well as with the list command.

  --password=<value>  Password used for authentication

    Specify an authentication password. Using a password for authentication
    prevents this user from also using a public key for authentication.

  --public-key=<value>  Public key used for authentication

    Specifies the public key to use for authentication. The corresponding
    private key is required locally to connect through this user. Using a public
    key for authentication prevents this user from also using a password for
    authentication.

```
