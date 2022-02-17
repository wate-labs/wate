# wate

A tool to run automated tests against web APIs

`wate` is a test automation tool for web based APIs. It was originally written
for blackbox testing 3rd party APIs.

## Building blocks

`wate` has the following building blocks:

- environments
- requests
  - pre request hook
- suites
  - cases
    - params
    - captures
    - assertions

### Environments

An environment refers to the basic setup for an API. This usually means setting
the base URL and the HTTP scheme.

### Requests

The base for everything in `wate` is a request. This can be a static
request body in the simplest case but also have replaceable values in the
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

> Note that you can do a `npm init` and add any dependencies you need.

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

### Suites

Suites are used to group requests via cases together and allow chaining of
requests (e.g. authentication and protected resource calls).

Suites have a name and one or more cases.

> Suite files can be both in JSON or YAML file format. The precedence is JSON
> over YAML in case of same names.

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

Captures can be defined for a request. These [JSONata](https://jsonata.org)
expressions are applied to the response of a request and stored in the context.
JSONata allows querying and transforming the output JSON. See project for
details.

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

###### Exports

You can define exports to persist given value (e.g. captures) to a file that can
later be picked up by a subsequent suite run. These exported values are
namespaced by the case and are available in the same named case in a subsequent
suite. This is needed when you want to test delayed or asynchronous features
like the result of a processing.

> To actually be able to use this in an automated fasion the delay can be
> steered by a CI tool like GitLab CI.

###### Imports

Imports are the counterpart for exports. This allows to tell the case which
formerly exported values to load from the shared file and use f.e. as a
parameter for the follow up case. To use a formerly exported value use the
`$imports.` format (e.g. `$imports.exportName`).

## Setting up a new project

To bootstrap a new project `wate init` can be used which will automatically
create the folder structure needed.

To bootstrap the building blocks please refer to the [commands](#commands).

## Usage

<!-- usage -->

```sh-session
$ npm install -g wate
$ wate COMMAND
running command...
$ wate (-v|--version|version)
wate/0.2.0 darwin-x64 node-v14.17.3
$ wate --help [COMMAND]
USAGE
  $ wate COMMAND
...
```

<!-- usagestop -->

## Commands

<!-- commands -->

- [`wate autocomplete [SHELL]`](#wate-autocomplete-shell)
- [`wate create:environment NAME`](#wate-createenvironment-name)
- [`wate create:request REQUESTNAME`](#wate-createrequest-requestname)
- [`wate create:suite SUITENAME`](#wate-createsuite-suitename)
- [`wate help [COMMAND]`](#wate-help-command)
- [`wate init`](#wate-init)
- [`wate list:environments`](#wate-listenvironments)
- [`wate list:requests`](#wate-listrequests)
- [`wate list:suites`](#wate-listsuites)
- [`wate run:request ENVIRONMENT REQUEST`](#wate-runrequest-environment-request)
- [`wate run:suite ENVIRONMENT SUITE`](#wate-runsuite-environment-suite)

## `wate autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ wate autocomplete [SHELL]

ARGUMENTS
  SHELL  shell type

OPTIONS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

EXAMPLES
  $ wate autocomplete
  $ wate autocomplete bash
  $ wate autocomplete zsh
  $ wate autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v0.3.0/src/commands/autocomplete/index.ts)_

## `wate create:environment NAME`

create new environment

```
USAGE
  $ wate create:environment NAME

ARGUMENTS
  NAME  name of the environment, e.g. my_collection/my_environment

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ wate create:environment
```

_See code: [src/commands/create/environment.ts](https://github.com/scflode/wate/blob/v0.2.0/src/commands/create/environment.ts)_

## `wate create:request REQUESTNAME`

create new request

```
USAGE
  $ wate create:request REQUESTNAME

ARGUMENTS
  REQUESTNAME  name of the request, e.g. my_collection/my_request

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ wate create:request
```

_See code: [src/commands/create/request.ts](https://github.com/scflode/wate/blob/v0.2.0/src/commands/create/request.ts)_

## `wate create:suite SUITENAME`

create new suite

```
USAGE
  $ wate create:suite SUITENAME

ARGUMENTS
  SUITENAME  name of the suite, e.g. my_collection/my_suite

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ wate create:suite
```

_See code: [src/commands/create/suite.ts](https://github.com/scflode/wate/blob/v0.2.0/src/commands/create/suite.ts)_

## `wate help [COMMAND]`

display help for wate

```
USAGE
  $ wate help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.3.1/src/commands/help.ts)_

## `wate init`

initialize new wate project

```
USAGE
  $ wate init

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ wate init
```

_See code: [src/commands/init.ts](https://github.com/scflode/wate/blob/v0.2.0/src/commands/init.ts)_

## `wate list:environments`

list the available environments

```
USAGE
  $ wate list:environments

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ wate list:environments
```

_See code: [src/commands/list/environments.ts](https://github.com/scflode/wate/blob/v0.2.0/src/commands/list/environments.ts)_

## `wate list:requests`

list the available collections and requests

```
USAGE
  $ wate list:requests

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ wate list:requests
```

_See code: [src/commands/list/requests.ts](https://github.com/scflode/wate/blob/v0.2.0/src/commands/list/requests.ts)_

## `wate list:suites`

list the available suites

```
USAGE
  $ wate list:suites

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ wate list:suites
```

_See code: [src/commands/list/suites.ts](https://github.com/scflode/wate/blob/v0.2.0/src/commands/list/suites.ts)_

## `wate run:request ENVIRONMENT REQUEST`

run an existing request

```
USAGE
  $ wate run:request ENVIRONMENT REQUEST

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
  $ wate run:request test ping
```

_See code: [src/commands/run/request.ts](https://github.com/scflode/wate/blob/v0.2.0/src/commands/run/request.ts)_

## `wate run:suite ENVIRONMENT SUITE`

run an existing suite

```
USAGE
  $ wate run:suite ENVIRONMENT SUITE

ARGUMENTS
  ENVIRONMENT  environment to use
  SUITE        name of the suite

OPTIONS
  -a, --assertions             print assertion results for each request
  -c, --captures               print captured values for each request
  -d, --dry                    perform a dry run without emitting requests
  -h, --help                   show CLI help
  -p, --parameters=parameters  use given parameter name and value in request
  -r, --report                 write report to file
  -v, --verbose                print the raw response headers and body

EXAMPLE
  $ wate run:suite test suite
```

_See code: [src/commands/run/suite.ts](https://github.com/scflode/wate/blob/v0.2.0/src/commands/run/suite.ts)_

<!-- commandsstop -->
