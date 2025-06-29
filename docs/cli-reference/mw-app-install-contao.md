# mw app install contao

```
$ mw app install contao --help
Creates new Contao installation.

USAGE
  $ mw app install contao --version <value> [-p <value>] [-q] [--host <value>]
    [--admin-firstname <value>] [--admin-user <value>] [--admin-email <value>]
    [--admin-pass <value>] [--admin-lastname <value>] [--site-title <value>]
    [-w] [--wait-timeout <value>]

FLAGS
  -p, --project-id=<value>       ID or short ID of a project; this flag is
                                 optional if a default project is set in the
                                 context
  -q, --quiet                    suppress process output and only display a
                                 machine-readable summary.
  -w, --wait                     wait for the resource to be ready.
      --admin-email=<value>      email address of your administrator user.
      --admin-firstname=<value>  first name of your administrator user.
      --admin-lastname=<value>   Lastname of your administrator user.
      --admin-pass=<value>       password of your administrator user.
      --admin-user=<value>       Username for your administrator user.
      --host=<value>             host to initially configure your Contao
                                 installation with; needs to be created
                                 separately.
      --site-title=<value>       site title for your Contao installation.
      --version=<value>          (required) [default: latest] version of Contao
                                 to be installed.
      --wait-timeout=<value>     [default: 600s] the duration to wait for the
                                 resource to be ready (common units like 'ms',
                                 's', 'm' are accepted).

DESCRIPTION
  Creates new Contao installation.

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

  --admin-email=<value>  email address of your administrator user.

    email address that will be used for the first administrator user that is
    created during the Contao installation.
    If unspecified, email address of your mStudio account will be used. This
    email address can be changed after the installation is finished.

  --admin-firstname=<value>  first name of your administrator user.

    The first name that will be used for the first administrator user that is
    created during the Contao installation.
    If unspecified, the first name of your mStudio user will be used. This value
    can be changed after the installation is finished.

  --admin-lastname=<value>  Lastname of your administrator user.

    The last name that will be used for the first administrator user that is
    created during the Contao installation.
    If unspecified, the last name of your mStudio user will be used. This value
    can be changed after the installation is finished.

  --admin-pass=<value>  password of your administrator user.

    The password that will be used for the first administrator user that is
    created during the Contao installation.
    If unspecified, a random secure password will be generated and printed to
    stdout. This password can be changed after the installation is finished

  --admin-user=<value>  Username for your administrator user.

    Username of the first administrator user which will be created during the
    Contao installation.
    If unspecified, an adequate username will be generated.
    After the installation is finished, the username can be changed and
    additional administrator users can be created.

  --host=<value>

    host to initially configure your Contao installation with; needs to be
    created separately.

    Specify a host which will be used during the installation and as an initial
    host for the Contao configuration.
    If unspecified, the default host for the given project will be used.
    This does not change the target of the used host and can be changed later by
    configuring the host and your Contao installation.

  --site-title=<value>  site title for your Contao installation.

    The site title for this Contao installation. It is also the title shown in
    the app overview in the mStudio and the CLI.
    If unspecified, the application name and the given project ID will be used.
    The title can be changed after the installation is finished

  --version=<value>  version of Contao to be installed.

    Specify the version in which your Contao will be installed.
    If unspecified, the Contao will be installed in the latest available
    version.

```
