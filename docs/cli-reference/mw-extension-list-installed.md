# mw extension list-installed

```
$ mw extension list-installed --help
List installed extensions in an organization or project.

USAGE
  $ mw extension list-installed -o txt|json|yaml|csv|tsv [-x] [--no-header]
    [--no-truncate] [--no-relative-dates] [--csv-separator ,|;] [--org-id
    <value>] [--project-id <value>]

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
      --org-id=<value>          the ID of the organization to install the
                                extension in
      --project-id=<value>      the ID of the project to install the extension
                                in

DESCRIPTION
  List installed extensions in an organization or project.

```
