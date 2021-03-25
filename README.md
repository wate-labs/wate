artes
=====

A tool for automated tests for web APIs

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/artes.svg)](https://npmjs.org/package/artes)
[![Downloads/week](https://img.shields.io/npm/dw/artes.svg)](https://npmjs.org/package/artes)
[![License](https://img.shields.io/npm/l/artes.svg)](https://github.com/scflode/artes/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g artes
$ artes COMMAND
running command...
$ artes (-v|--version|version)
artes/0.0.0 darwin-x64 node-v14.16.0
$ artes --help [COMMAND]
USAGE
  $ artes COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`artes hello [FILE]`](#artes-hello-file)
* [`artes help [COMMAND]`](#artes-help-command)

## `artes hello [FILE]`

describe the command here

```
USAGE
  $ artes hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ artes hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/scflode/artes/blob/v0.0.0/src/commands/hello.ts)_

## `artes help [COMMAND]`

display help for artes

```
USAGE
  $ artes help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_
<!-- commandsstop -->
