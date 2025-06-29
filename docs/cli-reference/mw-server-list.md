# mw server list

```
$ mw server list --help
List servers for an organization or user.

USAGE
  $ mw server list -o txt|json|yaml|csv|tsv [-x] [--no-header]
    [--no-truncate] [--no-relative-dates] [--csv-separator ,|;]

FLAGS
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
  List servers for an organization or user.

```
