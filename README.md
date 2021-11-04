# artes

A tool to run automated tests against web APIs

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/artes.svg)](https://npmjs.org/package/artes)
[![Downloads/week](https://img.shields.io/npm/dw/artes.svg)](https://npmjs.org/package/artes)
[![License](https://img.shields.io/npm/l/artes.svg)](https://github.com/scflode/artes/blob/master/package.json)

<!-- toc -->
* [artes](#artes)
* [Documentation](#documentation)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Documentation

artes is a test automation tool for web based APIs. It was originally written
for blackbox testing 3rd party APIs.

## Building blocks

artes has the following building blocks:

- environments
- requests
  - pre request hooks
  - post response hooks
- suites
  - cases
    - params
    - captures
    - assertions

### Environments

An environment refers to the basic setup for an API. This usually means setting
the base URL and the HTTP scheme.

### Requests

The base for everything regarding artes is a request. This can be a static
request body in the simplest case but also have computation of values in the
pre request hooks and gathering of interesing or needed data via the post
response hooks.

A request is independent of a suite. It is possible to provide parameters via
the CLI.

> Note: The header and body values become essentially nunjucks templates. This
> means you can use whatever [nunjucks](https://mozilla.github.io/nunjucks/templating.html)
> has to offer.

> Note: `object`s and `Array<any>`s are automatically `JSON.stringify`'d but need
> to have the [`safe`](https://mozilla.github.io/nunjucks/templating.html#safe)
> filter applied in the template.

#### Pre request script

Each request has an optional pre request script which is a plain JS module.

The pre request scripts is provided with the context and parameters.

> Context: The context contains the environment data as well as any previously
> captured values (captures).

> Parameters: The parameters are either passed by the CLI or defined in a suite-
> based request.

In order to make certain calculations like getting the current date to provide
in the request this script can be used.

The expected return is a key-value object with the parameters calculated in the
script.

The parameters will get merged with the already exising statically defined or
provided via the CLI ones.

> Note: The parameters will replace existing ones that have the same name.

#### Post response script

TBD

### Suites

Suites are used to group requests via cases together and allow chaining of
requests (e.g. authentication and protected resource calls).

Suites have a name and one or more cases.

#### Cases

A suite consists of one or more cases. The cases have one or more requests
defined.

Cases have a name and one or more requests.

##### Case requests

Requests as descibe above are the building block of suite cases. Used in the
context of a case requests have some additional functionality.

###### Params

Static values for requests can be defined as part of the `params` property.

###### Captures

Captures can be defined for a request. These [JSONPath](https://github.com/JSONPath-Plus/JSONPath)
expressions are applied to the response of a request and stored in the context.

Captures therefore can also be reused in follow-up requests as parameters with
the prefix `$captures.` and the name of the capture (e.g.
`"myParam": "$captures.capturedValue`)

Captures are also needed if you want to do assertions. Assertions are descibed
below.

> When a suite finishes all captures throughout the lifecycle will be printed.
> Additionally you can let the captures be printed for every single request to
> see them in context.

###### Assertions

Assertions are used to test actual values captured from a response against
expected values.

Assertions are key-value pairs with the name of a previous capture and the value
set to the expected one.

> Note: Currently only matching (the actual value has to match the expected) is
> supported.

> When a suite finishes all assertions throughout the lifecycle will be printed.
> Additionally you can let the assertions be printed for every single request to
> see them in context.
> If an assertions fails an error message is being displayed (exit code > 0).

## Setting up a new project

To bootstrap a new project `artes init` can be used which will automatically
create the folder structure needed.

To bootstrap the building blocks please refer to the [commands](#commands).

# Usage

<!-- usage -->
```sh-session
$ npm install -g artes
$ artes COMMAND
running command...
$ artes (-v|--version|version)
artes/0.1.0-dev darwin-x64 node-v14.17.3
$ artes --help [COMMAND]
USAGE
  $ artes COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`artes autocomplete [SHELL]`](#artes-autocomplete-shell)
* [`artes create:environment ENVIRONMENTNAME`](#artes-createenvironment-environmentname)
* [`artes create:request REQUESTNAME`](#artes-createrequest-requestname)
* [`artes create:suite SUITENAME`](#artes-createsuite-suitename)
* [`artes help [COMMAND]`](#artes-help-command)
* [`artes init`](#artes-init)
* [`artes list:environments`](#artes-listenvironments)
* [`artes list:requests`](#artes-listrequests)
* [`artes list:suites`](#artes-listsuites)
* [`artes run:request ENVIRONMENT REQUEST`](#artes-runrequest-environment-request)
* [`artes run:suite ENVIRONMENT SUITE`](#artes-runsuite-environment-suite)

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

## `artes create:environment ENVIRONMENTNAME`

create new environment

```
USAGE
  $ artes create:environment ENVIRONMENTNAME

ARGUMENTS
  ENVIRONMENTNAME  name of the environment, e.g. my_collection/my_environment

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ artes create:environment
```

_See code: [src/commands/create/environment.ts](https://github.com/scflode/artes/blob/v0.1.0-dev/src/commands/create/environment.ts)_

## `artes create:request REQUESTNAME`

create new request

```
USAGE
  $ artes create:request REQUESTNAME

ARGUMENTS
  REQUESTNAME  name of the request, e.g. my_collection/my_request

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ artes create:request
```

_See code: [src/commands/create/request.ts](https://github.com/scflode/artes/blob/v0.1.0-dev/src/commands/create/request.ts)_

## `artes create:suite SUITENAME`

create new suite

```
USAGE
  $ artes create:suite SUITENAME

ARGUMENTS
  SUITENAME  name of the suite, e.g. my_collection/my_suite

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ artes create:suite
```

_See code: [src/commands/create/suite.ts](https://github.com/scflode/artes/blob/v0.1.0-dev/src/commands/create/suite.ts)_

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

_See code: [src/commands/init.ts](https://github.com/scflode/artes/blob/v0.1.0-dev/src/commands/init.ts)_

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

_See code: [src/commands/list/environments.ts](https://github.com/scflode/artes/blob/v0.1.0-dev/src/commands/list/environments.ts)_

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

_See code: [src/commands/list/requests.ts](https://github.com/scflode/artes/blob/v0.1.0-dev/src/commands/list/requests.ts)_

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

_See code: [src/commands/list/suites.ts](https://github.com/scflode/artes/blob/v0.1.0-dev/src/commands/list/suites.ts)_

## `artes run:request ENVIRONMENT REQUEST`

run an existing request

```
USAGE
  $ artes run:request ENVIRONMENT REQUEST

ARGUMENTS
  ENVIRONMENT  environment to use
  REQUEST      name of the request

OPTIONS
  -c, --captures=captures      capture value from response with given JSONPath expression
  -d, --dry                    perform a dry run without emitting the request
  -h, --help                   show CLI help
  -p, --parameters=parameters  use given parameter name and value in request
  -v, --verbose                print the raw response headers and body

EXAMPLE
  $ artes run:request test ping
```

_See code: [src/commands/run/request.ts](https://github.com/scflode/artes/blob/v0.1.0-dev/src/commands/run/request.ts)_

## `artes run:suite ENVIRONMENT SUITE`

run an existing suite

```
USAGE
  $ artes run:suite ENVIRONMENT SUITE

ARGUMENTS
  ENVIRONMENT  environment to use
  SUITE        name of the suite

OPTIONS
  -a, --assertions             print assertion results for each request
  -c, --captures               print captured values for each request
  -d, --dry                    perform a dry run without emitting requests
  -h, --help                   show CLI help
  -p, --parameters=parameters  use given parameter name and value in request
  -v, --verbose                print the raw response headers and body

EXAMPLE
  $ artes run:suite test suite
```

_See code: [src/commands/run/suite.ts](https://github.com/scflode/artes/blob/v0.1.0-dev/src/commands/run/suite.ts)_
<!-- commandsstop -->
