# mw app update

```
$ mw app update --help
Update properties of an app installation (use 'upgrade' to update the app version)

USAGE
  $ mw app update [INSTALLATION-ID] [-q] [--description <value>]
    [--entrypoint <value>] [--document-root <value>]

ARGUMENTS
  INSTALLATION-ID  ID or short ID of an app installation; this argument is
                   optional if a default app installation is set in the context.

FLAGS
  -q, --quiet                  suppress process output and only display a
                               machine-readable summary.
      --description=<value>    update the description of the app installation
      --document-root=<value>  update the document root of the app installation
      --entrypoint=<value>     update the entrypoint of the app installation
                               (Python and Node.js only)

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

  --description=<value>  update the description of the app installation

    This flag updates the description of the app installation. If omitted, the
    description will not be changed.

  --document-root=<value>  update the document root of the app installation

    Updates the document root of the app installation. If omitted, the document
    root will not be changed. Note that not all apps support this field.

  --entrypoint=<value>

    update the entrypoint of the app installation (Python and Node.js only)

    Updates the entrypoint of the app installation. If omitted, the entrypoint
    will not be changed. Note that this field is only available for some types
    of apps (like Python and Node.js).

```
