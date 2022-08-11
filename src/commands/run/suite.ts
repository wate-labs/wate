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
import {Assertion, AssertionBag} from '../../assertion'
import ExcelReport from '../../data/excel-report'
import JsonExport from '../../exporter/json'
import {isArray, isObject} from 'lodash'

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
    export: Flags.boolean({
      char: 'e',
      description: 'export the request and response bodies',
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
      const delayedRequests = await this.runCase(suiteCase, context, flags)
      if (delayedRequests.length > 0) {
        delayed.push([
          suiteCase.name,
          delayedRequests,
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
      (!this.hasAssertions(context.assertions) || flags.verbose)
    ) {
      this.printCaptures(
        context.captures,
        `All captures for ${suite.name}`.toUpperCase(),
      )
    }

    if (this.hasAssertions(context.assertions)) {
      let exportFilepath
      if (flags.report) {
        const assertions = Object.values(context.assertions).flat()

        exportFilepath = await this.export(suite.name, assertions, context.captures)
      }

      const assertions = Object.values(context.assertions).flat()

      this.printAssertions(
        assertions,
        `Assertions for ${suite.name}`.toUpperCase(),
        exportFilepath,
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
        if (request.delayed !== undefined && request.delayed <= counter) {
          let response: Response = ResponseHelper.emptyResponse(request)

          this.log(dim(`[${caseName}] Running ${request.name} (${request.url})`))
          request = RequestBuilder.render(caseName, request, context)

          if (flags.verbose) {
            this.log(Printer.request(request))
          }

          if (!flags.dry) {
            response = await this.runRequestWithRetries(caseName, request, response, context, flags)
          }

          if (flags.verbose) {
            this.log(Printer.response(response))
          }

          if (response.hasError) {
            this.error(
              [
                `[${caseName}] Finished request ${request.name} with an error: ${response.error.reason} on ${request.url}`,
                Printer.requestAndResponse(request, response, false),
              ].join('\n'),
            )
          }

          this.log(
            [
              dim(
                `[${caseName}] Finished request ${request.name} with status ${response.status} in ${response.durationInMs}ms`,
              ),
            ].join('\n'),
          )
        } else {
          if (request.delayed === undefined) {
            request = this.determineDelayedRequests(remainingRequests, request)
          }

          remainingRequests.push(request)
        }
      }

      if (remainingRequests.length > 0) {
        remainingQueue.push([caseName, remainingRequests])
      }
    }

    return remainingQueue
  }

  private determineDelayedRequests(remainingRequests: Request[], request: Request) {
    const delayedRequestsLeft = remainingRequests.filter(request => request.delayed)
    if (delayedRequestsLeft.length === 0) {
      request.delayed = 0
    }

    return request
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
      assertions: {},
    }
    if (flags.parameters) {
      flags.parameters.forEach((raw: string) => {
        const [name, value] = raw.split(/=(.*)/s)
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
      export: boolean;
    },
  ): Promise<Request[]> {
    const startTime = Date.now()
    this.log(`Starting case ${suiteCase.name}`)
    const delayed: Request[] = []
    let hasDelayed = false
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
        hasDelayed = true
        continue
      }

      // Put all subsequent requests after a delayed one to queue as well.
      if (hasDelayed) {
        this.log(
          dim(
            `[${suiteCase.name}] Put request to queue. Will be run after delayed predecessor.`,
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

      if (flags.export) {
        this.exportRequestAndResponse(suiteCase.name, request, response)
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

  private async runRequestWithRetries(
    caseName: string,
    request: Request,
    response: Response,
    context: Context,
    flags: { captures: boolean, assertions: boolean, verbose: boolean },
  ): Promise<Response> {
    let attempt = 0
    if (request.retries && request.retries > 0) {
      this.log(`Retrying request ${request.name} for ${request.retries} times in case of an error.`)
      while (attempt < request.retries && (response.hasError || response.status === 0)) {
        attempt++
        this.log(`Waiting ${request.delayed} ticks for attempt ${attempt} of ${request.retries} for request ${request.name}`)

        let counter = 0
        while (counter < request.delayed) {
          counter = await this.tick(counter)
        }

        response = await this.runRequest(caseName, request, context, {
          printCaptures: flags.captures,
          printAssertions: flags.assertions,
        })
        if (flags.verbose) {
          this.log(Printer.response(response))
        }
      }

      return response
    }

    response = await this.runRequest(caseName, request, context, {
      printCaptures: flags.captures,
      printAssertions: flags.assertions,
    })

    return response
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

    let assertions: Assertion[] = []
    if (request.assertions.length > 0) {
      if (!response.hasError) {
        assertions = Asserter.assert(
          caseName,
          request.assertions,
          context.captures,
        )
      }

      if (!context.assertions[caseName]) {
        context.assertions[caseName] = [] as Assertion[]
      }

      context.assertions[caseName] = [...context.assertions[caseName], ...assertions]

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

  private printAssertions(assertions: Assertion[], title?: string, exportFilepath?: string) {
    const hasFailedAssertions = assertions.filter(
      assertion => !assertion.matched,
    ).length
    this.log(['', title || 'Assertions'.toUpperCase(), ''].join('\n'))
    let lastCaseName = ''
    const printableAssertions = Object.values(assertions).map(assertion => {
      const caseName =
        lastCaseName === assertion.caseName ? '' : assertion.caseName
      lastCaseName = assertion.caseName

      return {
        case_name: caseName,
        name: assertion.name,
        '': ` ${this.generateMarker(assertion)} `,
        expected: assertion.expected === '###' ? '' : this.prettify(assertion.expected),
        actual: this.prettify(assertion.actual),
      }
    })
    CliUx.ux.table(
      printableAssertions,
      {
        case_name: {header: 'Case Name', minWidth: 50},
        name: {header: 'Name', minWidth: 20},
        '': {minWidth: 3},
        expected: {header: 'Expected', minWidth: 30},
        actual: {header: 'Actual', minWidth: 30},
      },
      {'no-truncate': true},
    )

    if (exportFilepath) {
      this.log(['', bold(`Exported report to "${exportFilepath}"`), ''].join('\n'))
    }

    if (hasFailedAssertions) {
      this.error(`There were ${hasFailedAssertions} assertion(s) that failed`)
    }
  }

  private async export(
    name: string,
    assertions: Assertion[],
    captures: Capture[],
  ): Promise<string> {
    this.log(`Generating export for ${name}`)
    const printableAssertions = assertions.map(assertion => {
      return {
        matched: this.generateMarker(assertion),
        case_name: assertion.caseName,
        debug: this.buildDebug(
          captures.filter(capture => capture.caseName === assertion.caseName),
        ),
        name: assertion.name,
        expected: assertion.expected === '###' ? '' : assertion.expected,
        actual: assertion.actual,
      }
    })

    return ExcelReport.write(name, printableAssertions)
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

  private exportRequestAndResponse(caseName: string, request: Request, response: Response) {
    const pattern = /\//g
    const name = request.url.replace(pattern, '_')
    const requestFilename = JsonExport.write(`${name}_rq`, request.data, caseName)
    const responseFilename = JsonExport.write(`${name}_rs`, response.data, caseName)

    this.log(`Exported request to ${requestFilename} and response to ${responseFilename}`)
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

  private hasAssertions(assertionBag: AssertionBag): boolean {
    const assertions = Object.values(assertionBag).flat()

    return assertions.length > 0
  }

  private generateMarker(assertion: Assertion): string {
    let marker = ''

    if (!(assertion.expected === '###' && assertion.expected !== assertion.actual && assertion.matched)) {
      marker = assertion.matched ? '✓' : '⨯'
    }

    return marker
  }

  private prettify(value: any): any {
    if (isObject(value) || isArray(value)) {
      return Printer.prettify(value)
    }

    return value
  }
}
