# mw project membership get-own

```
$ mw project membership get-own --help
Get the executing user's membership in a Project.

USAGE
  $ mw project membership get-own -o txt|json|yaml [-p <value>]

FLAGS
  -o, --output=<option>     (required) [default: txt] output in a more machine
                            friendly format
                            <options: txt|json|yaml>
  -p, --project-id=<value>  ID or short ID of a project; this flag is optional
                            if a default project is set in the context

DESCRIPTION
  Get the executing user's membership in a Project.

FLAG DESCRIPTIONS
  -p, --project-id=<value>

    ID or short ID of a project; this flag is optional if a default project is
    set in the context

    May contain a short ID or a full ID of a project; you can also use the "mw
    context set --project-id=<VALUE>" command to persistently set a default
    project for all commands that accept this flag.

```
