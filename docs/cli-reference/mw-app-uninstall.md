# mw app uninstall

```
$ mw app uninstall --help
Uninstall an app

USAGE
  $ mw app uninstall [INSTALLATION-ID] [-q] [-f]

ARGUMENTS
  INSTALLATION-ID  ID or short ID of an app installation; this argument is
                   optional if a default app installation is set in the context.

FLAGS
  -f, --force  Do not ask for confirmation
  -q, --quiet  suppress process output and only display a machine-readable
               summary.

DESCRIPTION
  Uninstall an app

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

```
