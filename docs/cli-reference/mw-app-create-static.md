# mw app create static

```
$ mw app create static --help
Creates new custom static site installation.

USAGE
  $ mw app create static --document-root <value> [-p <value>] [-q]
    [--site-title <value>] [-w] [--wait-timeout <value>]

FLAGS
  -p, --project-id=<value>     ID or short ID of a project; this flag is
                               optional if a default project is set in the
                               context
  -q, --quiet                  suppress process output and only display a
                               machine-readable summary.
  -w, --wait                   wait for the resource to be ready.
      --document-root=<value>  (required) [default: /] the document root from
                               which your custom static site will be served
                               (relative to the installation path)
      --site-title=<value>     site title for your custom static site
                               installation.
      --wait-timeout=<value>   [default: 600s] the duration to wait for the
                               resource to be ready (common units like 'ms',
                               's', 'm' are accepted).

DESCRIPTION
  Creates new custom static site installation.

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

  --document-root=<value>

    the document root from which your custom static site will be served
    (relative to the installation path)

    This is the document root from which the files of your application will be
    served by the web server. This directory is specified relative to the
    installation path.

  --site-title=<value>  site title for your custom static site installation.

    The site title for this custom static site installation. It is also the
    title shown in the app overview in the mStudio and the CLI.
    If unspecified, the application name and the given project ID will be used.
    The title can be changed after the installation is finished

```
