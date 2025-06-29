# mw conversation reply

```
$ mw conversation reply --help
Reply to a conversation

USAGE
  $ mw conversation reply [CONVERSATION-ID] [--message <value> | --message-from
    <value>] [--editor <value>]

ARGUMENTS
  CONVERSATION-ID  ID or short ID of a conversation; this argument is optional
                   if a default conversation is set in the context.

FLAGS
  --editor=<value>        [default: vim] The editor to use when opening the
                          message for editing; will respect your EDITOR
                          environment variable, and fall back on 'vim' if that
                          is not set.
  --message=<value>       The body of the message to send; if neither this nor
                          --message-from is given, an editor will be opened to
                          enter the message.
  --message-from=<value>  A file from which to read the message to send; may be
                          '-' to read from stdin. If neither this nor --message
                          is given, an editor will be opened to enter the
                          message.

DESCRIPTION
  Reply to a conversation

```
