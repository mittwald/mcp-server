# mw app create python

```
$ mw app create python --help
Creates new custom python site installation.

USAGE
  $ mw app create python [-p <value>] [-q] [--site-title <value>] [--entrypoint
    <value>] [-w] [--wait-timeout <value>]

FLAGS
  -p, --project-id=<value>    ID or short ID of a project; this flag is optional
                              if a default project is set in the context
  -q, --quiet                 suppress process output and only display a
                              machine-readable summary.
  -w, --wait                  wait for the resource to be ready.
      --entrypoint=<value>    the command that should be used to start your
                              custom python site application.
      --site-title=<value>    site title for your custom python site
                              installation.
      --wait-timeout=<value>  [default: 600s] the duration to wait for the
                              resource to be ready (common units like 'ms', 's',
                              'm' are accepted).

DESCRIPTION
  Creates new custom python site installation.

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

  --entrypoint=<value>

    the command that should be used to start your custom python site
    application.

    This is the command that should be used to start your application; the app
    is required to run in the foreground, and to listen on the port specified by
    the PORT environment variable.

  --site-title=<value>  site title for your custom python site installation.

    The site title for this custom python site installation. It is also the
    title shown in the app overview in the mStudio and the CLI.
    If unspecified, the application name and the given project ID will be used.
    The title can be changed after the installation is finished

```
