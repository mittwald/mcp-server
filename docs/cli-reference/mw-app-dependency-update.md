# mw app dependency update

```
$ mw app dependency update --help
Update the dependencies of an app

USAGE
  $ mw app dependency update [INSTALLATION-ID] --set <value>... [-q]
    [--update-policy none|inheritedFromApp|patchLevel|all]

ARGUMENTS
  INSTALLATION-ID  ID or short ID of an app installation; this argument is
                   optional if a default app installation is set in the context.

FLAGS
  -q, --quiet                   suppress process output and only display a
                                machine-readable summary.
      --set=<value>...          (required) set a dependency to a specific
                                version
      --update-policy=<option>  [default: patchLevel] set the update policy for
                                the configured dependencies
                                <options: none|inheritedFromApp|patchLevel|all>

EXAMPLES
  Update Node.js version to newest available from the 18.x branch

    $ mw app dependency update $APP_ID --set node=~18

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

  --set=<value>...  set a dependency to a specific version

    The format is <dependency>=<version>, where <dependency> is the name of the
    dependency (use the "mw app dependency list" command to get a list of
    available dependencies) and <version> is a semver constraint.

    This flag may be specified multiple times to update multiple dependencies.

```
