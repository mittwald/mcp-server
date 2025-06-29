# mw domain dnszone update

```
$ mw domain dnszone update --help
Updates a record set of a DNS zone

USAGE
  $ mw domain dnszone update DNSZONE-ID RECORD-SET [-q] [-p <value>] [--record
    <value>... | --managed | --unset] [--ttl <value>]

ARGUMENTS
  DNSZONE-ID  ID or domain name of a DNS zone
  RECORD-SET  (a|mx|txt|srv|cname) The record type of the record set

FLAGS
  -p, --project-id=<value>  ID or short ID of a project; this flag is optional
                            if a default project is set in the context
  -q, --quiet               suppress process output and only display a
                            machine-readable summary.
      --managed             Reset this record set to fully-managed (only for A
                            and MX records)
      --record=<value>...   The records to set; may not be used with --managed
      --ttl=<value>         The TTL of the record set; omit to use the default
                            TTL
      --unset               Set this to remove all records from the record set

DESCRIPTION
  Updates a record set of a DNS zone

EXAMPLES
  Set A and AAAA records

    $ mw domain dnszone update domain.example a --record 203.0.113.123 \
      --record 2001:db8::1

  Set MX records

    $ mw domain dnszone update domain.example mx --record "10 \
      mail1.domain.example" --record "20 mail2.domain.example"

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

  --record=<value>...  The records to set; may not be used with --managed

    The format depends on the record set type:

    - for "a" records, this parameter should contain a IPv4 or IPv6 address (we
    will automatically create an A or AAAA record)
    - for "mx" records, the parameter should be formatted as "<priority>
    <fqdn>", e.g. "10 mail.example.com"
    - for "srv" records, the parameter should be formatted as "<priority>
    <weight> <port> <fqdn>", e.g. "10 1 5060 sip.example.com"
    - for "txt" records, the parameter should be a string containing the TXT
    record value.

```
