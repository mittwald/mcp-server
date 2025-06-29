# mw app upgrade

```
$ mw app upgrade --help
Upgrade app installation to target version

USAGE
  $ mw app upgrade [INSTALLATION-ID] [--target-version <value>] [-f] [-p
    <value>] [-q] [-w] [--wait-timeout <value>]

ARGUMENTS
  INSTALLATION-ID  ID or short ID of an app installation; this argument is
                   optional if a default app installation is set in the context.

FLAGS
  -f, --force                   Do not ask for confirmation.
  -p, --project-id=<value>      ID or short ID of a project; this flag is
                                optional if a default project is set in the
                                context
  -q, --quiet                   suppress process output and only display a
                                machine-readable summary.
  -w, --wait                    wait for the resource to be ready.
      --target-version=<value>  target version to upgrade app to; if omitted,
                                target version will be prompted interactively
      --wait-timeout=<value>    [default: 600s] the duration to wait for the
                                resource to be ready (common units like 'ms',
                                's', 'm' are accepted).

DESCRIPTION
  Upgrade app installation to target version

FLAG DESCRIPTIONS
  -p, --project-id=<value>

    ID or short ID of a project; this flag is optional if a default project is
    set in the context

    May contain a short ID or a full ID of a project; you can also use the "mw
    context set --project-id=<VALUE>" command to persistently set a default
    project for all commands that accept this flag.

  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

```
