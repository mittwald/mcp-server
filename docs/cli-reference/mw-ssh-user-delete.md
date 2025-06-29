# mw ssh-user delete

```
$ mw ssh-user delete --help
Delete an SSH user

USAGE
  $ mw ssh-user delete SSH-USER-ID [-q] [-f]

ARGUMENTS
  SSH-USER-ID  The ID of the SSH user to delete

FLAGS
  -f, --force  Do not ask for confirmation
  -q, --quiet  suppress process output and only display a machine-readable
               summary.

DESCRIPTION
  Delete an SSH user

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

```
