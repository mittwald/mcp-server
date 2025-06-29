# mw extension install

```
$ mw extension install --help
Install an extension in a project or organization

USAGE
  $ mw extension install EXTENSION-ID [-q] [--org-id <value>] [--project-id
    <value>] [--consent]

ARGUMENTS
  EXTENSION-ID  the ID of the extension to install

FLAGS
  -q, --quiet               suppress process output and only display a
                            machine-readable summary.
      --consent             consent to the extension having access to the
                            requested scopes
      --org-id=<value>      the ID of the organization to install the extension
                            in
      --project-id=<value>  the ID of the project to install the extension in

DESCRIPTION
  Install an extension in a project or organization

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

```
