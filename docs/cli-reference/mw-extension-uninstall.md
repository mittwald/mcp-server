# mw extension uninstall

```
$ mw extension uninstall --help
Remove an extension from an organization

USAGE
  $ mw extension uninstall EXTENSION-INSTANCE-ID [-q]

ARGUMENTS
  EXTENSION-INSTANCE-ID  the ID of the extension instance to uninstall

FLAGS
  -q, --quiet  suppress process output and only display a machine-readable
               summary.

DESCRIPTION
  Remove an extension from an organization

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

```
