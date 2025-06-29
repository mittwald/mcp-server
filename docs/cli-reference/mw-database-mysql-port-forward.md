# mw database mysql port-forward

```
$ mw database mysql port-forward --help
Forward the TCP port of a MySQL database to a local port

USAGE
  $ mw database mysql port-forward DATABASE-ID [-q] [--ssh-user <value>]
    [--ssh-identity-file <value>] [--port <value>]

ARGUMENTS
  DATABASE-ID  The ID or name of the database

FLAGS
  -q, --quiet         suppress process output and only display a
                      machine-readable summary.
      --port=<value>  [default: 3306] The local TCP port to forward to

SSH CONNECTION FLAGS
  --ssh-identity-file=<value>  the SSH identity file (private key) to use for
                               public key authentication.
  --ssh-user=<value>           override the SSH user to connect with; if
                               omitted, your own user will be used

DESCRIPTION
  Forward the TCP port of a MySQL database to a local port

  This command forwards the TCP port of a MySQL database to a local port on your
  machine. This allows you to connect to the database as if it were running on
  your local machine.

  This command relies on connecting to your hosting environment via SSH. For
  this, it will use your systems SSH client under the hood, and will respect
  your SSH configuration in ~/.ssh/config.

  An exception to this is the 'User' configuration, which will be overridden by
  this command to either your authenticated mStudio user or the user specified
  with the --ssh-user flag.

  See https://linux.die.net/man/5/ssh_config for a reference on the
  configuration file.

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

  --ssh-identity-file=<value>

    the SSH identity file (private key) to use for public key authentication.

    The SSH identity file to use for the connection. This file should contain an
    SSH private key and will be used to authenticate the connection to the
    server.

    You can also set this value by setting the MITTWALD_SSH_IDENTITY_FILE
    environment variable.

  --ssh-user=<value>

    override the SSH user to connect with; if omitted, your own user will be
    used

    This flag can be used to override the SSH user that is used for a
    connection; be default, your own personal user will be used for this.

    You can also set this value by setting the MITTWALD_SSH_USER environment
    variable.

```
