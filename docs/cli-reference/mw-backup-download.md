# mw backup download

```
$ mw backup download --help
Download a backup to your local disk

USAGE
  $ mw backup download BACKUP-ID [-q] [--format tar|zip] [--password <value>
    | --generate-password | --prompt-password] [--resume --output <value>]

ARGUMENTS
  BACKUP-ID  ID or short ID of a backup.

FLAGS
  -q, --quiet              suppress process output and only display a
                           machine-readable summary.
      --format=<option>    [default: tar] the file format to download the backup
                           in.
                           <options: tar|zip>
      --generate-password  generate a random password to encrypt the backup
                           with.
      --output=<value>     the file to write the backup to; if omitted, the
                           filename will be determined by the server.
      --password=<value>   the password to encrypt the backup with.
      --prompt-password    prompt for a password to encrypt the backup with.
      --resume             resume a previously interrupted download.

DESCRIPTION
  Download a backup to your local disk

ALIASES
  $ mw project backup download

FLAG DESCRIPTIONS
  -q, --quiet

    suppress process output and only display a machine-readable summary.

    This flag controls if you want to see the process output or only a summary.
    When using mw non-interactively (e.g. in scripts), you can use this flag to
    easily get the IDs of created resources for further processing.

  --generate-password  generate a random password to encrypt the backup with.

    CAUTION: this is not stored anywhere.

  --password=<value>  the password to encrypt the backup with.

    CAUTION #1: this is not stored anywhere.
    CAUTION #2: it is dangerous to use this option, as the password might be
    stored in your shell history.

  --prompt-password  prompt for a password to encrypt the backup with.

    CAUTION: this is not stored anywhere.

```
