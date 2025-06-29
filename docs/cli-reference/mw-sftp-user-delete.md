# mw sftp-user delete

```
$ mw sftp-user delete --help
Delete an SFTP user

USAGE
  $ mw sftp-user delete SFTP-USER-ID [-q] [-f]

ARGUMENTS
  SFTP-USER-ID  The ID of the SFTP user to delete

FLAGS
  -f, --force  Do not ask for confirmation
  -q, --quiet  suppress process output and only display a machine-readable
               summary.

DESCRIPTION
  Delete an SFTP user

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

```
