# mw project filesystem usage

```
$ mw project filesystem usage --help
Get a project directory filesystem usage.

USAGE
  $ mw project filesystem usage [PROJECT-ID] -o txt|json|yaml [--human]

ARGUMENTS
  PROJECT-ID  ID or short ID of a project; this argument is optional if a
              default project is set in the context.

FLAGS
  -o, --output=<option>  (required) [default: txt] output in a more machine
                         friendly format
                         <options: txt|json|yaml>
      --human            Display human readable sizes.

DESCRIPTION
  Get a project directory filesystem usage.

```
