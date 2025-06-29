# mw project ssh

```
$ mw project ssh --help
Connect to a project via SSH

USAGE
  $ mw project ssh [PROJECT-ID] [--ssh-user <value>] [--ssh-identity-file
    <value>]

ARGUMENTS
  PROJECT-ID  ID or short ID of a project; this argument is optional if a
              default project is set in the context.

SSH CONNECTION FLAGS
  --ssh-identity-file=<value>  the SSH identity file (private key) to use for
                               public key authentication.
  --ssh-user=<value>           override the SSH user to connect with; if
                               omitted, your own user will be used

DESCRIPTION
  Connect to a project via SSH

  Establishes an interactive SSH connection to a project.

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
