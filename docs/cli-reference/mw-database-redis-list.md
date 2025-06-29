# mw database redis list

```
$ mw database redis list --help
List Redis databases belonging to a project.

USAGE
  $ mw database redis list -o txt|json|yaml|csv|tsv [-x] [--no-header]
    [--no-truncate] [--no-relative-dates] [--csv-separator ,|;] [-p <value>]

FLAGS
  -o, --output=<option>         (required) [default: txt] output in a more
                                machine friendly format
                                <options: txt|json|yaml|csv|tsv>
  -p, --project-id=<value>      ID or short ID of a project; this flag is
                                optional if a default project is set in the
                                context
  -x, --extended                show extended information
      --csv-separator=<option>  [default: ,] separator for CSV output (only
                                relevant for CSV output)
                                <options: ,|;>
      --no-header               hide table header
      --no-relative-dates       show dates in absolute format, not relative
                                (only relevant for txt output)
      --no-truncate             do not truncate output (only relevant for txt
                                output)

DESCRIPTION
  List Redis databases belonging to a project.

FLAG DESCRIPTIONS
  -p, --project-id=<value>

    ID or short ID of a project; this flag is optional if a default project is
    set in the context

    May contain a short ID or a full ID of a project; you can also use the "mw
    context set --project-id=<VALUE>" command to persistently set a default
    project for all commands that accept this flag.

```
