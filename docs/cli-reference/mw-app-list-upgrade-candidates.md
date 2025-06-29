# mw app list-upgrade-candidates

```
$ mw app list-upgrade-candidates --help
List upgrade candidates for an app installation.

USAGE
  $ mw app list-upgrade-candidates [INSTALLATION-ID] -o txt|json|yaml|csv|tsv [-x]
    [--no-header] [--no-truncate] [--no-relative-dates] [--csv-separator ,|;]

ARGUMENTS
  INSTALLATION-ID  ID or short ID of an app installation; this argument is
                   optional if a default app installation is set in the context.

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
  List upgrade candidates for an app installation.

```
