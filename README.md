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

#### Matrices

Sometimes there is a fairly complex setup for testing a particular behavior
needed in terms of the cases. To not have to copy the ceremonial setups over
and over again the matrix feature comes to help.

With a matrix you can define only the parts of a case that actually change,
e.g. an age which is used in one or more test case requests. The parts
supported are:

- params
- captures
- assertions

In the request's definition you can access those as `$matrix.params.age` for 
single value access or `$matrix.captures` for complete replacements.

Cases acting as matrix test cases need to be annotated with the property
`matrix: true`.

> Note: complete replacements still need to match the overall schema. Hence
> those might need prefixing of the special propery name `_`, e.g. 
> `_: $matrix.captures`.

All matrix defintions are run sequentially, one after another.

#### Cases

A suite consists of one or more cases. The cases have one or more requests
defined.

Cases have a name and one or more requests.

##### Case requests

Requests as descibe above are the building block of suite cases. Used in the
context of a case requests have some additional functionality. All case 
requests are run sequentially.

> Case requests can also have a `delayed` property set which delays execution
> in seconds. These requests are queued and executed at the end of the suite.
> The captures defined are evaluated at runtime.

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

If you need to capture a value from the respective request you can do so by using
the prefix `$request.` in front. It will extract the value after the prefix, e.g.
`$request.my.value` will extract the jsonata path `my.value` from the request.

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

If you need to assert that a capture of a previous request matches the a capture
of the current request you can access the capture via `$captures.` prefix.

If you use the `$captures.` prefix in context of the current request (colocated)
the value of the capture is printed without assertion counterpart. This is useful
to add some reference exports to the assertion table for further context.

> Note: Currently only matching (the actual value has to match the expected) is
> supported.

> When a suite finishes all assertions throughout the lifecycle will be printed.
> Additionally you can let the assertions be printed for every single request to
> see them in context.
> If an assertions fails an error message is being displayed (exit code > 0).

## Setting up a new project

To bootstrap a new project `wate init` can be used which will automatically
create the folder structure needed.

To bootstrap the building blocks please refer to the [commands](#commands).

## Commands

<!-- commands -->
* [`wate autocomplete [SHELL]`](#wate-autocomplete-shell)
* [`wate create:environment NAME`](#wate-createenvironment-name)
* [`wate create:request REQUESTNAME`](#wate-createrequest-requestname)
* [`wate create:suite SUITENAME`](#wate-createsuite-suitename)
* [`wate help [COMMAND]`](#wate-help-command)
* [`wate init`](#wate-init)
* [`wate list:environments`](#wate-listenvironments)
* [`wate list:requests`](#wate-listrequests)
* [`wate list:suites`](#wate-listsuites)
* [`wate run:request ENVIRONMENT REQUEST`](#wate-runrequest-environment-request)
* [`wate run:suite ENVIRONMENT SUITE`](#wate-runsuite-environment-suite)

## `wate autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ wate autocomplete [SHELL] [-r]

ARGUMENTS
  SHELL  shell type

FLAGS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

DESCRIPTION
  display autocomplete installation instructions

EXAMPLES
  $ wate autocomplete

  $ wate autocomplete bash

  $ wate autocomplete zsh

  $ wate autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v1.3.0/src/commands/autocomplete/index.ts)_

## `wate create:environment NAME`

create new environment

```
USAGE
  $ wate create:environment [NAME] [-h]

ARGUMENTS
  NAME  name of the environment, e.g. my_collection/my_environment

FLAGS
  -h, --help  Show CLI help.

DESCRIPTION
  create new environment

EXAMPLES
  $ wate create:environment
```

_See code: [dist/commands/create/environment.ts](https://github.com/wate-labs/wate/blob/v0.7.1/dist/commands/create/environment.ts)_

## `wate create:request REQUESTNAME`

create new request

```
USAGE
  $ wate create:request [REQUESTNAME] [-h]

ARGUMENTS
  REQUESTNAME  name of the request, e.g. my_collection/my_request

FLAGS
  -h, --help  Show CLI help.

DESCRIPTION
  create new request

EXAMPLES
  $ wate create:request
```

_See code: [dist/commands/create/request.ts](https://github.com/wate-labs/wate/blob/v0.7.1/dist/commands/create/request.ts)_

## `wate create:suite SUITENAME`

create new suite

```
USAGE
  $ wate create:suite [SUITENAME] [-h]

ARGUMENTS
  SUITENAME  name of the suite, e.g. my_collection/my_suite

FLAGS
  -h, --help  Show CLI help.

DESCRIPTION
  create new suite

EXAMPLES
  $ wate create:suite
```

_See code: [dist/commands/create/suite.ts](https://github.com/wate-labs/wate/blob/v0.7.1/dist/commands/create/suite.ts)_

## `wate help [COMMAND]`

Display help for wate.

```
USAGE
  $ wate help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for wate.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.12/src/commands/help.ts)_

## `wate init`

initialize new wate project

```
USAGE
  $ wate init [-h]

FLAGS
  -h, --help  Show CLI help.

DESCRIPTION
  initialize new wate project

EXAMPLES
  $ wate init
```

_See code: [dist/commands/init.ts](https://github.com/wate-labs/wate/blob/v0.7.1/dist/commands/init.ts)_

## `wate list:environments`

list the available environments

```
USAGE
  $ wate list:environments [-h]

FLAGS
  -h, --help  Show CLI help.

DESCRIPTION
  list the available environments

EXAMPLES
  $ wate list:environments
```

_See code: [dist/commands/list/environments.ts](https://github.com/wate-labs/wate/blob/v0.7.1/dist/commands/list/environments.ts)_

## `wate list:requests`

list the available collections and requests

```
USAGE
  $ wate list:requests [-h]

FLAGS
  -h, --help  Show CLI help.

DESCRIPTION
  list the available collections and requests

EXAMPLES
  $ wate list:requests
```

_See code: [dist/commands/list/requests.ts](https://github.com/wate-labs/wate/blob/v0.7.1/dist/commands/list/requests.ts)_

## `wate list:suites`

list the available suites

```
USAGE
  $ wate list:suites [-h]

FLAGS
  -h, --help  Show CLI help.

DESCRIPTION
  list the available suites

EXAMPLES
  $ wate list:suites
```

_See code: [dist/commands/list/suites.ts](https://github.com/wate-labs/wate/blob/v0.7.1/dist/commands/list/suites.ts)_

## `wate run:request ENVIRONMENT REQUEST`

run an existing request

```
USAGE
  $ wate run:request [ENVIRONMENT] [REQUEST] [-h] [-v] [-d] [-p <value>] [-c <value>] [-e]

ARGUMENTS
  ENVIRONMENT  environment to use
  REQUEST      name of the request

FLAGS
  -c, --captures=<value>...    capture value from response with given JSONPath expression
  -d, --dry                    perform a dry run without emitting the request
  -e, --export                 export the requests and responses
  -h, --help                   Show CLI help.
  -p, --parameters=<value>...  use given parameter name and value in request
  -v, --verbose                print the raw response headers and body

DESCRIPTION
  run an existing request

EXAMPLES
  $ wate run:request test ping
```

_See code: [dist/commands/run/request.ts](https://github.com/wate-labs/wate/blob/v0.7.1/dist/commands/run/request.ts)_

## `wate run:suite ENVIRONMENT SUITE`

run an existing suite

```
USAGE
  $ wate run:suite [ENVIRONMENT] [SUITE] [-h] [-v] [-p <value>] [-d] [-c] [-a] [-r] [-e]

ARGUMENTS
  ENVIRONMENT  environment to use
  SUITE        name of the suite

FLAGS
  -a, --assertions             print assertion results for each request
  -c, --captures               print captured values for each request
  -d, --dry                    perform a dry run without emitting requests
  -e, --export                 export the request and response bodies
  -h, --help                   Show CLI help.
  -p, --parameters=<value>...  use given parameter name and value in request
  -r, --report                 write report to file
  -v, --verbose                print the raw response headers and body

DESCRIPTION
  run an existing suite

EXAMPLES
  $ wate run:suite test suite
```

_See code: [dist/commands/run/suite.ts](https://github.com/wate-labs/wate/blob/v0.7.1/dist/commands/run/suite.ts)_
<!-- commandsstop -->
