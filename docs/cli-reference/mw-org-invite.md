# mw org invite

```
$ mw org invite
╭──────────────────────────────────────────────────────────────────────────────╮
│ ERROR                                                                        │
│                                                                              │
│ An error occurred while executing this command:                              │
│                                                                              │
│   Error: The following error occurred:                                       │
│     Missing required flag email                                              │
│   See more help with --help                                                  │
│                                                                              │
│ If you believe this to be a bug, please open an issue at                     │
│ https://github.com/mittwald/cli/issues/new.                                  │
╰──────────────────────────────────────────────────────────────────────────────╯

  ERROR STACK TRACE

  Please provide this when opening a bug report.

  Error: The following error occurred:
    Missing required flag email
  See more help with --help
      at validateFlags (/opt/homebrew/Cellar/mw/1.4.3/libexec/node_modules/@oc
  lif/core/lib/parser/validate.js:77:19)
      at async Object.parse (/opt/homebrew/Cellar/mw/1.4.3/libexec/node_module
  s/@oclif/core/lib/parser/index.js:22:5)
      at async Invite.parse (/opt/homebrew/Cellar/mw/1.4.3/libexec/node_module
  s/@oclif/core/lib/command.js:274:25)
      at async Invite.init (file:///opt/homebrew/Cellar/mw/1.4.3/libexec/dist/
  lib/basecommands/ExtendedBaseCommand.js:10:33)
      at async Invite._run (/opt/homebrew/Cellar/mw/1.4.3/libexec/node_modules
  /@oclif/core/lib/command.js:180:13)
      at async Config.runCommand (/opt/homebrew/Cellar/mw/1.4.3/libexec/node_m
  odules/@oclif/core/lib/config/config.js:456:25)
      at async Object.run (/opt/homebrew/Cellar/mw/1.4.3/libexec/node_modules/
  @oclif/core/lib/main.js:96:16)

```
