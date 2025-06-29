# mw app copy

```
$ mw app copy --help
Copy an app within a project

USAGE
  $ mw app copy [INSTALLATION-ID] --description <value> [-q]

ARGUMENTS
  INSTALLATION-ID  ID or short ID of an app installation; this argument is
                   optional if a default app installation is set in the context.

FLAGS
  -q, --quiet                suppress process output and only display a
                             machine-readable summary.
      --description=<value>  (required) set a description for the new app
                             installation

DESCRIPTION
  Copy an app within a project

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

```
