import {Command, flags} from '@oclif/command'
import {cli} from 'cli-ux'
import * as Chalk from 'chalk'
import Context from '../../context'
import EnvironmentLoader from '../../environment/loader'
import SuiteLoader from '../../suite/loader'
import Request from '../../request'
import Response from '../../response'
import RequestRunner from '../../request/runner'
import {Case} from '../../suite'
import Printer from '../../helpers/printer'
import ResponseHelper from '../../helpers/response'
import {Capture} from '../../capture'
import RequestBuilder from '../../request/builder'
import Asserter from '../../assertion/asserter'
import {Assertion} from '../../assertion'

const {bold, dim} = Chalk

export default class SuiteCommand extends Command {
  static args = [
    {name: 'environment', description: 'environment to use', required: true},
    {name: 'suite', description: 'name of the suite', required: true},
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    verbose: flags.boolean({
      char: 'v',
      description: 'print the raw response headers and body',
    }),
    parameters: flags.string({
      char: 'p',
      description: 'use given parameter name and value in request',
      multiple: true,
    }),
    dry: flags.boolean({
      char: 'd',
      description: 'perform a dry run without emitting requests',
    }),
    captures: flags.boolean({
      char: 'c',
      description: 'print captured values for each request',
    }),
    assertions: flags.boolean({
      char: 'a',
      description: 'print assertion results for each request',
    }),
  }

  static description = 'run an existing suite'

  static examples = ['$ wate run:suite test suite']

  static envDir = 'environments'

  static reqDir = 'requests'

  static suiteDir = 'suites'

  async run() {
    const {args, flags} = this.parse(SuiteCommand)
    const envName = args.environment
    const suiteName = args.suite
    const environment = EnvironmentLoader.load(SuiteCommand.envDir, envName)
    const context = this.buildContext(flags, envName)
    const startTime = Date.now()
    const suite = SuiteLoader.load(SuiteCommand.suiteDir, suiteName, context)
    this.log(
      [
        dim(
          `Running suite "${suite.name}" with environment "${envName}" against "${environment.host}"`,
        ),
        '',
        bold(`Cases to be run for ${suite.name}`.toUpperCase()),
        ...suite.cases.map(({name}) => {
          return `  ${name}`
        }),
      ].join('\n'),
      '\n',
    )
    const caseCount = suite.cases.length
    const requestCount = suite.cases.reduce(
      (acc, suiteCase) => acc + suiteCase.requests.length,
      0,
    )
    for await (const suiteCase of suite.cases) {
      await this.runCase(suiteCase, context, flags)
    }
    const durationInMs = Date.now() - startTime
    this.log(
      [
        dim(
          `Suite "${suite.name}" contains ${caseCount} test cases with ${requestCount} requests and was run in ${durationInMs}ms`,
        ),
      ].join('\n'),
    )
    if (context.captures.length > 0 && context.assertions.length === 0) {
      this.printCaptures(
        context.captures,
        `Summary for ${suite.name}`.toUpperCase(),
      )
    }
    if (context.assertions.length > 0) {
      this.printAssertions(
        context.assertions,
        `Assertions for ${suite.name}`.toUpperCase(),
      )
    }
  }

  private buildContext(
    flags: {parameters?: string[]},
    envName: string,
  ): Context {
    const context: Context = {
      requestsLocation: SuiteCommand.reqDir,
      environment: EnvironmentLoader.load(SuiteCommand.envDir, envName),
      params: [],
      captures: [],
      assertions: [],
    }
    if (flags.parameters) {
      flags.parameters.forEach((raw: string) => {
        const [name, value] = raw.split('=')
        context.params = [...context.params, {name, value}]
      })
    }

    return context
  }

  private async runCase(
    suiteCase: Case,
    context: Context,
    flags: {
      verbose: boolean;
      dry: boolean;
      captures: boolean;
      assertions: boolean;
    },
  ): Promise<Response[]> {
    const startTime = Date.now()
    this.log(`Starting case ${suiteCase.name}`)
    const responses: Response[] = []
    for await (let request of suiteCase.requests) {
      let response: Response = ResponseHelper.emptyResponse(request)

      this.log(dim(`[${suiteCase.name}] Running (${request.url})`))

      request = RequestBuilder.render(request, context)
      if (flags.verbose) {
        this.log(Printer.request(request))
      }

      if (!flags.dry) {
        response = await this.runRequest(request, context, {
          printCaptures: flags.captures,
          printAssertions: flags.assertions,
        })
      }

      if (flags.verbose) {
        this.log(Printer.response(response))
      }
      if (response.hasError) {
        this.error(
          [
            `[${suiteCase.name}] Finished request with an error: ${response.error.reason} on ${request.url}`,
            Printer.requestAndResponse(request, response, false),
          ].join('\n'),
        )
      }
      this.log(
        [
          dim(
            `[${suiteCase.name}] Finished request with status ${response.status} in ${response.durationInMs}ms`,
          ),
        ].join('\n'),
      )

      responses.push(response)
    }
    const durationInMs = Date.now() - startTime
    this.log(`Finished case ${suiteCase.name} in ${durationInMs}ms`, '\n')

    return responses
  }

  private async runRequest(
    request: Request,
    context: Context,
    flags: {
      printCaptures: boolean;
      printAssertions: boolean;
    },
  ) {
    const response = await RequestRunner.run(request)
    context.captures = [...context.captures, ...response.captures]
    if (response.captures.length > 0 && flags.printCaptures) {
      this.printCaptures(response.captures)
    }

    let assertions = null
    if (request.assertions.length > 0) {
      assertions = Asserter.assert(request.assertions, context.captures)
      context.assertions = [...context.assertions, ...assertions]
      if (flags.printAssertions) {
        this.printAssertions(assertions)
      }
    }

    return response
  }

  private printCaptures(captures: Capture[], title?: string) {
    this.log(['', title || 'Captured values'.toUpperCase(), ''].join('\n'))
    cli.table(
      captures.map(({name, value}) => {
        return {name, value: Printer.prettify(value)}
      }),
      {name: {}, value: {}},
      {'no-truncate': true},
    )
    this.log('')
  }

  private printAssertions(assertions: Assertion[], title?: string) {
    const hasFailedAssertions = assertions.filter(
      assertion => !assertion.matched,
    ).length
    const printableAssertions = assertions.map(assertion => {
      return {
        matched: assertion.matched ? '✓' : '⨯',
        name: assertion.name,
        expected: this.prettify(assertion.expected),
        actual: this.prettify(assertion.actual),
      }
    })
    this.log(['', title || 'Assertions'.toUpperCase(), ''].join('\n'))
    cli.table(printableAssertions, {
      matched: {},
      name: {},
      expected: {},
      actual: {},
    })
    this.log('')

    if (hasFailedAssertions) {
      this.error(`There were ${hasFailedAssertions} assertion(s) that failed`)
    }
  }

  private prettify(data: any): string {
    if (typeof data === 'object') {
      const values = Object.entries(data).reduce(
        (acc: Array<string>, [key, value]) => {
          const kv = `${key}: ${value}`
          acc.push(kv)

          return acc
        },
        [],
      )

      return values.join('\n')
    }

    return data
  }
}
