# mw org membership list

```
$ mw org membership list --help
List all memberships belonging to an organization.

USAGE
  $ mw org membership list -o txt|json|yaml|csv|tsv [-x] [--no-header]
    [--no-truncate] [--no-relative-dates] [--csv-separator ,|;] [-o <value>]

FLAGS
  -o, --org-id=<value>          ID or short ID of an org; this flag is optional
                                if a default org is set in the context
  -o, --output=<option>         (required) [default: txt] output in a more
                                machine friendly format
                                <options: txt|json|yaml|csv|tsv>
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
  List all memberships belonging to an organization.

FLAG DESCRIPTIONS
  -o, --org-id=<value>

    ID or short ID of an org; this flag is optional if a default org is set in
    the context

    May contain a short ID or a full ID of an org; you can also use the "mw
    context set --org-id=<VALUE>" command to persistently set a default org for
    all commands that accept this flag.

```
