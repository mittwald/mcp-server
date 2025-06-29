# mw domain virtualhost create

```
$ mw domain virtualhost create --help
Create a new ingress

USAGE
  $ mw domain virtualhost create --hostname <value> [-q] [-p <value>] [--path-to-app
    <value>...] [--path-to-url <value>...]

FLAGS
  -p, --project-id=<value>      ID or short ID of a project; this flag is
                                optional if a default project is set in the
                                context
  -q, --quiet                   suppress process output and only display a
                                machine-readable summary.
      --hostname=<value>        (required) the hostname of the ingress
      --path-to-app=<value>...  add a path mapping to an app
      --path-to-url=<value>...  add a path mapping to an external url

DESCRIPTION
  Create a new ingress

EXAMPLES
  Create a new ingress, with the root path mapping to your project's root
  directory

    $ mw domain virtualhost create --hostname mw.example --path-to-dir /:/

  Create a new ingress, with the root path mapping to an app

    $ mw domain virtualhost create --hostname mw.example --path-to-app \
      /:3ecaf1a9-6eb4-4869-b811-8a13c3a2e745

  Create a new ingress, with the root path mapping to a URL

    $ mw domain virtualhost create --hostname mw.example --path-to-url \
      /:https://redirect.example

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

  --path-to-app=<value>...  add a path mapping to an app

    This flag can be used to map a specific URL path to an app; the value for
    this flag should be the URL path and the app ID, separated by a colon, e.g.
    /:3ecaf1a9-6eb4-4869-b811-8a13c3a2e745. You can specify this flag multiple
    times to map multiple paths to different apps, and also combine it with the
    other --path-to-* flags.

  --path-to-url=<value>...  add a path mapping to an external url

    This flag can be used to map a specific URL path to an external URL; the
    value for this flag should be the URL path and the external URL, separated
    by a colon, e.g. /:https://redirect.example. You can specify this flag
    multiple times to map multiple paths to different external URLs, and also
    combine it with the other --path-to-* flags.

```
