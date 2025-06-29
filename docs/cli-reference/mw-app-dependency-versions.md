# mw app dependency versions

```
$ mw app dependency versions --help
Get all available versions of a particular dependency

USAGE
  $ mw app dependency versions SYSTEMSOFTWARE -o txt|json|yaml|csv|tsv [-x]
    [--no-header] [--no-truncate] [--no-relative-dates] [--csv-separator ,|;]

ARGUMENTS
  SYSTEMSOFTWARE  name of the systemsoftware for which to list versions

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
  Get all available versions of a particular dependency

```
