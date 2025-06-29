# mw app upload

```
$ mw app upload --help
Upload the filesystem of an app to a project

USAGE
  $ mw app upload [INSTALLATION-ID] --source <value> [-q] [--ssh-user
    <value>] [--ssh-identity-file <value>] [--exclude <value>...] [--dry-run]
    [--delete] [--remote-sub-directory <value>]

ARGUMENTS
  INSTALLATION-ID  ID or short ID of an app installation; this argument is
                   optional if a default app installation is set in the context.

FLAGS
  -q, --quiet                         suppress process output and only display a
                                      machine-readable summary.
      --delete                        delete remote files that are not present
                                      locally
      --dry-run                       do not actually upload the app
                                      installation
      --exclude=<value>...            [default: ] exclude files matching the
                                      given pattern
      --remote-sub-directory=<value>  specify a sub-directory within the app
                                      installation to upload
      --source=<value>                (required) source directory from which to
                                      upload the app installation

SSH CONNECTION FLAGS
  --ssh-identity-file=<value>  the SSH identity file (private key) to use for
                               public key authentication.
  --ssh-user=<value>           override the SSH user to connect with; if
                               omitted, your own user will be used

DESCRIPTION
  Upload the filesystem of an app to a project

  Upload the filesystem of an app from your local machine to a project.

  For this, rsync needs to be installed on your system.

  CAUTION: This is a potentially destructive operation. It will overwrite files
  on the server with the files from your local machine. This is NOT a turnkey
  deployment solution. It is intended for development purposes only.

  This command relies on connecting to your hosting environment via SSH. For
  this, it will use your systems SSH client under the hood, and will respect
  your SSH configuration in ~/.ssh/config.

  An exception to this is the 'User' configuration, which will be overridden by
  this command to either your authenticated mStudio user or the user specified
  with the --ssh-user flag.

  See https://linux.die.net/man/5/ssh_config for a reference on the
  configuration file.

  This command will also look for a file named .mw-rsync-filter in the current
  directory and use it as a filter file for rsync. Have a look at
  https://manpages.ubuntu.com/manpages/noble/en/man1/rsync.1.html#filter%20rules
  for more information on how to write filter rules.

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

  --remote-sub-directory=<value>

    specify a sub-directory within the app installation to upload

    This is particularly useful when you only want to upload a specific
    sub-directory of the app installation, for example when you are using a
    deployment tool that manages the app installation directory itself, and you
    only want to upload exempt files, like environment specific configuration
    files or user data. For example, if you want to upload to
    "/html/my-app-XXXXX/config", set "--remote-sub-directory=config".

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
