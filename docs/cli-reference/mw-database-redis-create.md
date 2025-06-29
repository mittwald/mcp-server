# mw database redis create

```
$ mw database redis create --help
Create a new Redis database

USAGE
  $ mw database redis create -d <value> --version <value> [-p <value>] [-q]
    [--persistent] [--max-memory <value>] [--max-memory-policy
    noeviction|allkeys-lru|allkeys-lfu|volatile-lru|volatile-lfu|allkeys-random|
    volatile-random|volatile-ttl]

FLAGS
  -d, --description=<value>         (required) a description for the database
  -p, --project-id=<value>          ID or short ID of a project; this flag is
                                    optional if a default project is set in the
                                    context
  -q, --quiet                       suppress process output and only display a
                                    machine-readable summary.
      --max-memory=<value>          the maximum memory for the Redis database
      --max-memory-policy=<option>  the Redis eviction policy
                                    <options: noeviction|allkeys-lru|allkeys-lfu
                                    |volatile-lru|volatile-lfu|allkeys-random|vo
                                    latile-random|volatile-ttl>
      --[no-]persistent             enable persistent storage for the Redis
                                    database
      --version=<value>             (required) the Redis version to use

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

  --max-memory=<value>  the maximum memory for the Redis database

    This specifies the maximum memory; you should provide a number, followed by
    one of the IEC suffixes, like "Ki", "Mi" or "Gi"

  --max-memory-policy=noeviction|allkeys-lru|allkeys-lfu|volatile-lru|volatile-lfu|allkeys-random|volatile-random|volatile-ttl

    the Redis eviction policy

    See https://redis.io/docs/reference/eviction/#eviction-policies for details

  --version=<value>  the Redis version to use

    Use the "database redis versions" command to list available versions

```
