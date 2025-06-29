# mw database mysql create

```
$ mw database mysql create --help
Create a new MySQL database

USAGE
  $ mw database mysql create -d <value> --version <value> [-p <value>] [-q]
    [--collation <value>] [--character-set <value>] [--user-password <value>]
    [--user-external] [--user-access-level full|readonly]

FLAGS
  -d, --description=<value>         (required) a description for the database
  -p, --project-id=<value>          ID or short ID of a project; this flag is
                                    optional if a default project is set in the
                                    context
  -q, --quiet                       suppress process output and only display a
                                    machine-readable summary.
      --character-set=<value>       [default: utf8mb4] the character set to use
      --collation=<value>           [default: utf8mb4_unicode_ci] the collation
                                    to use
      --user-access-level=<option>  [default: full] the access level preset for
                                    the default user
                                    <options: full|readonly>
      --user-external               enable external access for default user
      --user-password=<value>       the password to use for the default user
                                    (env: MYSQL_PWD)
      --version=<value>             (required) the MySQL version to use

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

  --version=<value>  the MySQL version to use

    Use the "database mysql versions" command to list available versions

```
