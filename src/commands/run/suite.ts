import {CliUx, Command, Flags} from '@oclif/core'
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
import Export from '../../data/export'

const {bold, dim} = Chalk

export default class SuiteCommand extends Command {
  static args = [
    {name: 'environment', description: 'environment to use', required: true},
    {name: 'suite', description: 'name of the suite', required: true},
  ];

  static flags = {
    help: Flags.help({char: 'h'}),
    verbose: Flags.boolean({
      char: 'v',
      description: 'print the raw response headers and body',
    }),
    parameters: Flags.string({
      char: 'p',
      description: 'use given parameter name and value in request',
      multiple: true,
    }),
    dry: Flags.boolean({
      char: 'd',
      description: 'perform a dry run without emitting requests',
    }),
    captures: Flags.boolean({
      char: 'c',
      description: 'print captured values for each request',
    }),
    assertions: Flags.boolean({
      char: 'a',
      description: 'print assertion results for each request',
    }),
    report: Flags.boolean({
      char: 'r',
      description: 'write report to file',
    }),
  };

  static description = 'run an existing suite';

  static examples = ['$ wate run:suite test suite'];

  static envDir = 'environments';

  static reqDir = 'requests';

  static suiteDir = 'suites';

  async run() {
    const {args, flags} = await this.parse(SuiteCommand)
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
    let delayed: [string, Request[]][] = []
    for await (const suiteCase of suite.cases) {
      const delayedCases = await this.runCase(suiteCase, context, flags)
      if (delayedCases.length > 0) {
        delayed.push([
          suiteCase.name,
          delayedCases,
        ])
      }
    }

    if (delayed.length > 0) {
      CliUx.ux.action.start('Waiting for delayed processing')
      let counter = 0
      let processed = false
      /* eslint-disable no-await-in-loop */
      while (!processed) {
        counter = await this.tick(counter)
        delayed = await this.runDelayed(delayed, counter, context, flags)
        if (delayed.length === 0) {
          this.log('Finished delayed processing')
          processed = true
        }
      }

      CliUx.ux.action.stop()
    }

    const durationInMs = Date.now() - startTime
    this.log(
      [
        dim(
          `Suite "${suite.name}" contains ${caseCount} test cases with ${requestCount} requests and was run in ${durationInMs}ms`,
        ),
      ].join('\n'),
    )
    if (
      context.captures.length > 0 &&
      (context.assertions.length === 0 || flags.verbose)
    ) {
      this.printCaptures(
        context.captures,
        `All captures for ${suite.name}`.toUpperCase(),
      )
    }

    if (context.assertions.length > 0) {
      if (flags.report) {
        await this.export(suite.name, context.assertions, context.captures)
      }

      this.printAssertions(
        context.assertions,
        `Assertions for ${suite.name}`.toUpperCase(),
      )
    }
  }

  private async runDelayed(
    delayedQueue: [string, Request[]][],
    counter: number,
    context: Context,
    flags: {
      captures: boolean;
      assertions: boolean;
      verbose: boolean;
      dry: boolean;
    },
  ): Promise<[string, Request[]][]> {
    const remainingQueue: [string, Request[]][] = []
    for (const [caseName, requests] of delayedQueue) {
      const remainingRequests: Request[] = []
      /* eslint-disable no-await-in-loop */
      for await (let request of requests) {
        if (request.delayed === counter) {
          let response: Response = ResponseHelper.emptyResponse(request)

          this.log(dim(`[${caseName}] Running (${request.url})`))
          request = RequestBuilder.render(caseName, request, context)
          if (flags.verbose) {
            this.log(Printer.request(request))
          }

          if (!flags.dry) {
            response = await this.runRequest(caseName, request, context, {
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
                `[${caseName}] Finished request with an error: ${response.error.reason} on ${request.url}`,
                Printer.requestAndResponse(request, response, false),
              ].join('\n'),
            )
          }

          this.log(
            [
              dim(
                `[${caseName}] Finished request with status ${response.status} in ${response.durationInMs}ms`,
              ),
            ].join('\n'),
          )
        } else {
          remainingRequests.push(request)
        }
      }

      if (remainingRequests.length > 0) {
        remainingQueue.push([caseName, remainingRequests])
      }
    }

    return remainingQueue
  }

  private buildContext(
    flags: { parameters?: string[] },
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
  ): Promise<Request[]> {
    const startTime = Date.now()
    this.log(`Starting case ${suiteCase.name}`)
    const delayed: Request[] = []
    for await (let request of suiteCase.requests) {
      let response: Response = ResponseHelper.emptyResponse(request)

      this.log(dim(`[${suiteCase.name}] Running (${request.url})`))

      if (request.delayed) {
        this.log(
          dim(
            `[${suiteCase.name}] Put request to queue. Will be run in ${request.delayed}s.`,
          ),
        )
        delayed.push(request)
        continue
      }

      request = RequestBuilder.render(suiteCase.name, request, context)

      if (flags.verbose) {
        this.log(Printer.request(request))
      }

      if (!flags.dry) {
        response = await this.runRequest(suiteCase.name, request, context, {
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
    }

    const durationInMs = Date.now() - startTime
    this.log(`Finished case ${suiteCase.name} in ${durationInMs}ms`, '\n')

    return delayed
  }

  private async runRequest(
    caseName: string,
    request: Request,
    context: Context,
    flags: {
      printCaptures: boolean;
      printAssertions: boolean;
    },
  ): Promise<Response> {
    const response = await RequestRunner.run(request)
    const captures = response.captures.map((capture: Capture) => {
      capture.caseName = caseName

      return capture
    })
    context.captures = [...context.captures, ...captures]
    if (response.captures.length > 0 && flags.printCaptures) {
      this.printCaptures(response.captures)
    }

    let assertions:Assertion[] = []
    if (request.assertions.length > 0) {
      if (!response.hasError) {
        assertions = Asserter.assert(
          caseName,
          request.assertions,
          context.captures,
        )
      }

      context.assertions = [...context.assertions, ...assertions]
      if (flags.printAssertions) {
        this.printAssertions(assertions)
      }
    }

    return response
  }

  private printCaptures(captures: Capture[], title?: string) {
    this.log(['', title || 'Captured values'.toUpperCase(), ''].join('\n'))
    CliUx.ux.table(
      captures.map(({caseName, name, value}) => {
        let printValue = value
        if (typeof value === 'object' || Array.isArray(value)) {
          printValue = Printer.prettify(value)
        }

        return {case_name: caseName, capture_name: name, value: printValue}
      }),
      {case_name: {}, capture_name: {}, value: {}},
      {'no-truncate': true},
    )
    this.log('')
  }

  private printAssertions(assertions: Assertion[], title?: string) {
    const hasFailedAssertions = assertions.filter(
      assertion => !assertion.matched,
    ).length
    this.log(['', title || 'Assertions'.toUpperCase(), ''].join('\n'))
    let lastCaseName = ''
    const printableAssertions = assertions.map(assertion => {
      const caseName =
        lastCaseName === assertion.caseName ? '' : assertion.caseName
      lastCaseName = assertion.caseName
      return {
        '': assertion.matched ? '✓' : '⨯',
        case_name: caseName,
        name: assertion.name,
        expected: assertion.expected,
        actual: assertion.actual,
      }
    })
    CliUx.ux.table(
      printableAssertions,
      {
        '': {},
        case_name: {minWidth: 50},
        name: {minWidth: 20},
        expected: {minWidth: 30},
        actual: {minWidth: 30},
      },
      {'no-truncate': true},
    )

    if (hasFailedAssertions) {
      this.error(`There were ${hasFailedAssertions} assertion(s) that failed`)
    }
  }

  private async export(
    name: string,
    assertions: Assertion[],
    captures: Capture[],
  ) {
    this.log(`Generating export for ${name}`)
    const printableAssertions = assertions.map(assertion => {
      return {
        matched: assertion.matched ? '✓' : '⨯',
        case_name: assertion.caseName,
        debug: this.buildDebug(
          captures.filter(capture => capture.caseName === assertion.caseName),
        ),
        name: assertion.name,
        expected: assertion.expected,
        actual: assertion.actual,
      }
    })
    const filename = await Export.write(name, printableAssertions)

    this.log(`Exported to ${filename}`)
  }

  private buildDebug(captures: Capture[]): string {
    if (captures.length === 0) {
      return ''
    }

    const printableCaptures = captures.map(
      capture => `${capture.name}: ${JSON.stringify(capture.value)}`,
    )

    return printableCaptures.join('\n')
  }

  private async tick(counter: number): Promise<number> {
    await this.sleep(1000)
    return counter + 1
  }

  private sleep(ms: number) {
    return new Promise(resolve => {
      setTimeout(resolve, ms)
    })
  }
}
