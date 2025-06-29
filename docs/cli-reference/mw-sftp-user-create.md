# mw sftp-user create

```
$ mw sftp-user create --help
Create a new SFTP user

USAGE
  $ mw sftp-user create --description <value> --directories <value>... [-p
    <value>] [-q] [--expires <value>] [--public-key <value>] [--password
    <value>] [--access-level read|full]

FLAGS
  -p, --project-id=<value>      ID or short ID of a project; this flag is
                                optional if a default project is set in the
                                context
  -q, --quiet                   suppress process output and only display a
                                machine-readable summary.
      --access-level=<option>   Set access level permissions for the SFTP user.
                                <options: read|full>
      --description=<value>     (required) Set description for SFTP user.
      --directories=<value>...  (required) Specify directories to restrict this
                                SFTP users access to.
      --expires=<value>         an interval after which the SFTP User expires
                                (examples: 30m, 30d, 1y).
      --password=<value>        Password used for authentication
      --public-key=<value>      Public key used for authentication

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

  --access-level=read|full  Set access level permissions for the SFTP user.

    Must be specified as either read or full. Grant the user either read-only or
    full file read and write privileges.

  --description=<value>  Set description for SFTP user.

    Set the description for the given SFTP user, which will be displayed in the
    mStudio as well as with the list command.

  --directories=<value>...

    Specify directories to restrict this SFTP users access to.

    Specified as a list of directories, will restrict access for this user to
    the specified directories.

  --password=<value>  Password used for authentication

    Specify an authentication password. Using a password for authentication
    prevents this user from also using a public key for authentication.

  --public-key=<value>  Public key used for authentication

    Specifies the public key to use for authentication. The corresponding
    private key is required locally to connect through this user. Using a public
    key for authentication prevents this user from also using a password for
    authentication.

```
