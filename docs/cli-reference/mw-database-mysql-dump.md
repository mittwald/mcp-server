# mw database mysql dump

```
$ mw database mysql dump --help
Create a dump of a MySQL database

USAGE
  $ mw database mysql dump DATABASE-ID -o <value> [-q] [-p <value>]
    [--mysql-charset <value>] [--temporary-user] [--ssh-user <value>]
    [--ssh-identity-file <value>] [--gzip]

ARGUMENTS
  DATABASE-ID  The ID or name of the database

FLAGS
  -o, --output=<value>          (required) the output file to write the dump to
                                ("-" for stdout)
  -p, --mysql-password=<value>  the password to use for the MySQL user (env:
                                MYSQL_PWD)
  -q, --quiet                   suppress process output and only display a
                                machine-readable summary.
      --gzip                    compress the dump with gzip
      --mysql-charset=<value>   the character set to use for the MySQL
                                connection
      --[no-]temporary-user     create a temporary user for the dump

SSH CONNECTION FLAGS
  --ssh-identity-file=<value>  the SSH identity file (private key) to use for
                               public key authentication.
  --ssh-user=<value>           override the SSH user to connect with; if
                               omitted, your own user will be used

DESCRIPTION
  Create a dump of a MySQL database

  This command creates a dump of a MySQL database via mysqldump and saves it to
  a local file.

  This command relies on connecting to your hosting environment via SSH. For
  this, it will use your systems SSH client under the hood, and will respect
  your SSH configuration in ~/.ssh/config.

  An exception to this is the 'User' configuration, which will be overridden by
  this command to either your authenticated mStudio user or the user specified
  with the --ssh-user flag.

  See https://linux.die.net/man/5/ssh_config for a reference on the
  configuration file.

FLAG DESCRIPTIONS
  -o, --output=<value>  the output file to write the dump to ("-" for stdout)

    The output file to write the dump to. You can specify "-" or "/dev/stdout"
    to write the dump directly to STDOUT; in this case, you might want to use
    the --quiet/-q flag to supress all other output, so that you can pipe the
    mysqldump for further processing.

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

  --gzip  compress the dump with gzip

    Compress the dump with gzip. This is useful for large databases, as it can
    significantly reduce the size of the dump.

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

  --[no-]temporary-user  create a temporary user for the dump

    Create a temporary user for this operation. This user will be deleted after
    the operation has completed. This is useful if you want to work with a
    database that is not accessible from the outside.

    If this flag is disabled, you will need to specify the password of the
    default user; either via the --mysql-password flag or via the MYSQL_PWD
    environment variable.

```
