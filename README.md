homelab-cli
=================

My homelab CLI


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/homelab-cli.svg)](https://npmjs.org/package/homelab-cli)
[![Downloads/week](https://img.shields.io/npm/dw/homelab-cli.svg)](https://npmjs.org/package/homelab-cli)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g homelab-cli
$ homelab COMMAND
running command...
$ homelab (--version)
homelab-cli/0.0.0 darwin-arm64 node-v22.21.0
$ homelab --help [COMMAND]
USAGE
  $ homelab COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`homelab hello PERSON`](#homelab-hello-person)
* [`homelab hello world`](#homelab-hello-world)
* [`homelab help [COMMAND]`](#homelab-help-command)
* [`homelab plugins`](#homelab-plugins)
* [`homelab plugins add PLUGIN`](#homelab-plugins-add-plugin)
* [`homelab plugins:inspect PLUGIN...`](#homelab-pluginsinspect-plugin)
* [`homelab plugins install PLUGIN`](#homelab-plugins-install-plugin)
* [`homelab plugins link PATH`](#homelab-plugins-link-path)
* [`homelab plugins remove [PLUGIN]`](#homelab-plugins-remove-plugin)
* [`homelab plugins reset`](#homelab-plugins-reset)
* [`homelab plugins uninstall [PLUGIN]`](#homelab-plugins-uninstall-plugin)
* [`homelab plugins unlink [PLUGIN]`](#homelab-plugins-unlink-plugin)
* [`homelab plugins update`](#homelab-plugins-update)
* [`homelab workspace list`](#homelab-workspace-list)

## `homelab hello PERSON`

Say hello

```
USAGE
  $ homelab hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ homelab hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/abes140377/homelab-cli/blob/v0.0.0/src/commands/hello/index.ts)_

## `homelab hello world`

Say hello world

```
USAGE
  $ homelab hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ homelab hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/abes140377/homelab-cli/blob/v0.0.0/src/commands/hello/world.ts)_

## `homelab help [COMMAND]`

Display help for homelab.

```
USAGE
  $ homelab help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for homelab.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.34/src/commands/help.ts)_

## `homelab plugins`

List installed plugins.

```
USAGE
  $ homelab plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ homelab plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.51/src/commands/plugins/index.ts)_

## `homelab plugins add PLUGIN`

Installs a plugin into homelab.

```
USAGE
  $ homelab plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into homelab.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the HOMELAB_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the HOMELAB_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ homelab plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ homelab plugins add myplugin

  Install a plugin from a github url.

    $ homelab plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ homelab plugins add someuser/someplugin
```

## `homelab plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ homelab plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ homelab plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.51/src/commands/plugins/inspect.ts)_

## `homelab plugins install PLUGIN`

Installs a plugin into homelab.

```
USAGE
  $ homelab plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into homelab.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the HOMELAB_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the HOMELAB_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ homelab plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ homelab plugins install myplugin

  Install a plugin from a github url.

    $ homelab plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ homelab plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.51/src/commands/plugins/install.ts)_

## `homelab plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ homelab plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ homelab plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.51/src/commands/plugins/link.ts)_

## `homelab plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ homelab plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ homelab plugins unlink
  $ homelab plugins remove

EXAMPLES
  $ homelab plugins remove myplugin
```

## `homelab plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ homelab plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.51/src/commands/plugins/reset.ts)_

## `homelab plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ homelab plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ homelab plugins unlink
  $ homelab plugins remove

EXAMPLES
  $ homelab plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.51/src/commands/plugins/uninstall.ts)_

## `homelab plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ homelab plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ homelab plugins unlink
  $ homelab plugins remove

EXAMPLES
  $ homelab plugins unlink myplugin
```

## `homelab plugins update`

Update installed plugins.

```
USAGE
  $ homelab plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.51/src/commands/plugins/update.ts)_

## `homelab workspace list`

List all workspaces

```
USAGE
  $ homelab workspace list

DESCRIPTION
  List all workspaces

EXAMPLES
  $ homelab workspace list
  ID                                   NAME         CREATED AT           UPDATED AT
  550e8400-e29b-41d4-a716-446655440001 production   2024-01-15 10:00:00  2024-01-15 10:00:00
  550e8400-e29b-41d4-a716-446655440002 staging      2024-01-20 14:30:00  2024-02-01 09:15:00
  550e8400-e29b-41d4-a716-446655440003 development  2024-02-01 08:00:00  2024-02-10 16:45:00
```

_See code: [src/commands/workspace/list.ts](https://github.com/abes140377/homelab-cli/blob/v0.0.0/src/commands/workspace/list.ts)_
<!-- commandsstop -->
