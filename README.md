# artes

A tool to run automated tests against web APIs

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/artes.svg)](https://npmjs.org/package/artes)
[![Downloads/week](https://img.shields.io/npm/dw/artes.svg)](https://npmjs.org/package/artes)
[![License](https://img.shields.io/npm/l/artes.svg)](https://github.com/scflode/artes/blob/master/package.json)

<!-- toc -->
* [artes](#artes)
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
artes/0.0.0 darwin-x64 node-v14.17.3
$ artes --help [COMMAND]
USAGE
  $ artes COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`artes autocomplete [SHELL]`](#artes-autocomplete-shell)
* [`artes create:request [REQUESTNAME]`](#artes-createrequest-requestname)
* [`artes help [COMMAND]`](#artes-help-command)
* [`artes init`](#artes-init)
* [`artes list:environments`](#artes-listenvironments)
* [`artes list:requests`](#artes-listrequests)
* [`artes list:suites`](#artes-listsuites)
* [`artes run:request ENVIRONMENT REQUEST`](#artes-runrequest-environment-request)

## `artes autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ artes autocomplete [SHELL]

ARGUMENTS
  SHELL  shell type

OPTIONS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

EXAMPLES
  $ artes autocomplete
  $ artes autocomplete bash
  $ artes autocomplete zsh
  $ artes autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v0.3.0/src/commands/autocomplete/index.ts)_

## `artes create:request [REQUESTNAME]`

create new request

```
USAGE
  $ artes create:request [REQUESTNAME]

ARGUMENTS
  REQUESTNAME  name of the request

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ artes create:request
```

_See code: [src/commands/create/request.ts](https://github.com/scflode/artes/blob/v0.0.0/src/commands/create/request.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.3/src/commands/help.ts)_

## `artes init`

initialize new artes project

```
USAGE
  $ artes init

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ artes init
```

_See code: [src/commands/init.ts](https://github.com/scflode/artes/blob/v0.0.0/src/commands/init.ts)_

## `artes list:environments`

list the available environments

```
USAGE
  $ artes list:environments

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ artes list:environments
```

_See code: [src/commands/list/environments.ts](https://github.com/scflode/artes/blob/v0.0.0/src/commands/list/environments.ts)_

## `artes list:requests`

list the available collections and requests

```
USAGE
  $ artes list:requests

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ artes list:requests
```

_See code: [src/commands/list/requests.ts](https://github.com/scflode/artes/blob/v0.0.0/src/commands/list/requests.ts)_

## `artes list:suites`

list the available suites

```
USAGE
  $ artes list:suites

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ artes list:suites
```

_See code: [src/commands/list/suites.ts](https://github.com/scflode/artes/blob/v0.0.0/src/commands/list/suites.ts)_

## `artes run:request ENVIRONMENT REQUEST`

run an existing request

```
USAGE
  $ artes run:request ENVIRONMENT REQUEST

ARGUMENTS
  ENVIRONMENT  environment to use
  REQUEST      name of the request

OPTIONS
  -h, --help   show CLI help
  -p, --print  print the raw response headers and body

EXAMPLE
  $ artes run:request test ping
```

_See code: [src/commands/run/request.ts](https://github.com/scflode/artes/blob/v0.0.0/src/commands/run/request.ts)_
<!-- commandsstop -->
