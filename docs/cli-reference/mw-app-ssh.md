# mw app ssh

```
$ mw app ssh --help
Connect to an app via SSH

USAGE
  $ mw app ssh [INSTALLATION-ID] [--ssh-user <value>]
    [--ssh-identity-file <value>] [--cd] [--info] [--test]

ARGUMENTS
  INSTALLATION-ID  ID or short ID of an app installation; this argument is
                   optional if a default app installation is set in the context.

FLAGS
  --[no-]cd  change to installation path after connecting
  --info     only print connection information, without actually connecting
  --test     test connection and exit

SSH CONNECTION FLAGS
  --ssh-identity-file=<value>  the SSH identity file (private key) to use for
                               public key authentication.
  --ssh-user=<value>           override the SSH user to connect with; if
                               omitted, your own user will be used

DESCRIPTION
  Connect to an app via SSH

  Establishes an interactive SSH connection to an app installation.

  This command is a wrapper around your systems SSH client, and will respect
  your SSH configuration in ~/.ssh/config.

  An exception to this is the 'User' configuration, which will be overridden by
  this command to either your authenticated mStudio user or the user specified
  with the --ssh-user flag.

  See https://linux.die.net/man/5/ssh_config for a reference on the
  configuration file.

FLAG DESCRIPTIONS
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
