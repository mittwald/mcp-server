# mw org delete

```
$ mw org delete --help
Delete an organization

USAGE
  $ mw org delete [ORG-ID] [-q] [-f]

ARGUMENTS
  ORG-ID  ID or short ID of an org; this argument is optional if a default org
          is set in the context.

FLAGS
  -f, --force  Do not ask for confirmation
  -q, --quiet  suppress process output and only display a machine-readable
               summary.

DESCRIPTION
  Delete an organization

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

```
