# mw database mysql shell

```
$ mw database mysql shell --help
Connect to a MySQL database via the MySQL shell

USAGE
  $ mw database mysql shell DATABASE-ID [-q] [--ssh-user <value>]
    [--ssh-identity-file <value>] [-p <value>] [--mysql-charset <value>]

ARGUMENTS
  DATABASE-ID  The ID or name of the database

FLAGS
  -p, --mysql-password=<value>  the password to use for the MySQL user (env:
                                MYSQL_PWD)
  -q, --quiet                   suppress process output and only display a
                                machine-readable summary.
      --mysql-charset=<value>   the character set to use for the MySQL
                                connection

SSH CONNECTION FLAGS
  --ssh-identity-file=<value>  the SSH identity file (private key) to use for
                               public key authentication.
  --ssh-user=<value>           override the SSH user to connect with; if
                               omitted, your own user will be used

DESCRIPTION
  Connect to a MySQL database via the MySQL shell

  This command opens an interactive mysql shell to a MySQL database.

  This command relies on connecting to your hosting environment via SSH. For
  this, it will use your systems SSH client under the hood, and will respect
  your SSH configuration in ~/.ssh/config.

  An exception to this is the 'User' configuration, which will be overridden by
  this command to either your authenticated mStudio user or the user specified
  with the --ssh-user flag.

  See https://linux.die.net/man/5/ssh_config for a reference on the
  configuration file.

FLAG DESCRIPTIONS
  -p, --mysql-password=<value>

    the password to use for the MySQL user (env: MYSQL_PWD)

    The password to use for the MySQL user. If not provided, the environment
    variable MYSQL_PWD will be used. If that is not set either, the command will
    interactively ask for the password.

    NOTE: This is a security risk, as the password will be visible in the
    process list of your system, and will be visible in your Shell history. It
    is recommended to use the environment variable instead.

  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

  --mysql-charset=<value>  the character set to use for the MySQL connection

    The character set that should be used for the MySQL connection. If omitted,
    the database's default character set will be used (for newer databases, this
    should be utf8mb4 in most cases, but really might be anything).

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
