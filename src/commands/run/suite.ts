import {CliUx, Command, Flags} from '@oclif/core'
import * as Chalk from 'chalk'
import {cloneDeep, isArray, isObject} from 'lodash'
import {Assertion, AssertionBag} from '../../assertion'
import Asserter from '../../assertion/asserter'
import {Capture} from '../../capture'
import Context from '../../context'
import ExcelReport from '../../data/excel-report'
import EnvironmentLoader from '../../environment/loader'
import JsonExport from '../../exporter/json'
import Printer from '../../helpers/printer'
import ResponseHelper from '../../helpers/response'
import Request from '../../request'
import RequestBuilder from '../../request/builder'
import RequestRunner from '../../request/runner'
import Response from '../../response'
import {Case, Suite} from '../../suite'
import SuiteLoader from '../../suite/loader'

const {bold, dim} = Chalk

export default class SuiteCommand extends Command {
  static args = [
    {name: 'environment', description: 'environment to use', required: true},
    {name: 'suite', description: 'name of the suite to run', required: true},
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
  }

  static description = 'run an existing suite';

  static examples = ['$ wate run:suite test suite'];

  static envDir = 'environments';

  static reqDir = 'requests';

  static suiteDir = 'suites';

  // Init counters for spinner display
  totalCases = 0
  pendingCases = 0
  finishedCases = 0
  totalRequests = 0
  remainingRequests = 0
  concurrentRunningRequests = 0

  async run() {
    const {args, flags} = await this.parse(SuiteCommand)
    const envName = args.environment
    const suiteName = args.suite
    const context = this.buildContext(flags, envName)
    const startTime = Date.now()
    const suite = SuiteLoader.load(SuiteCommand.suiteDir, suiteName, context)

    // Deterime suite statistics for printing out
    this.totalCases = suite.cases.length
    this.totalRequests = suite.cases.reduce(
      (acc, suiteCase) => acc + suiteCase.requests.length,
      0,
    )
    this.remainingRequests = this.totalRequests

    this.printIntro(suite, context)

    CliUx.ux.action.start(`Running suite with ${this.totalCases} cases and ${this.totalRequests} requests`)
    const casePromises = Object.values(suite.cases).map(async suiteCase => {
      // Wait if case has a delay configured
      if (suiteCase.delayed) {
        this.log(dim(`[${suiteCase.name}] Queued with a delay of ${suiteCase.delayed ?? 0} ticks`))
        await this.waitFor(suiteCase.delayed)
      }

      return this.runSuiteCase(suiteCase, context, flags)
    })
    await Promise.all(casePromises)

    CliUx.ux.action.stop('finished')

    const durationInMs = Date.now() - startTime
    this.log(
      [
        dim(
          `Suite "${suite.name}" contains ${this.totalCases} test cases with ${this.totalRequests} requests and was run in ${this.formatDuration(durationInMs)}`,
        ),
      ].join('\n'),
    )

    // Print captures
    if (
      context.captures.length > 0 &&
      (!this.hasAssertions(context.assertions) || flags.verbose)
    ) {
      this.printCaptures(
        context.captures,
        `All captures for ${suite.name}`.toUpperCase(),
      )
    }

    // Print and export assertions
    if (this.hasAssertions(context.assertions)) {
      let exportFilepath

      context.assertions = this.sortByCases(suite.cases, context.assertions)

      // Flatten assertions and sort
      const assertions = Object.values(context.assertions).flat()

      if (flags.report) {
        exportFilepath = await this.export(context.environment.name, suite.name, assertions, context.captures)
      }

      this.printAssertions(
        assertions,
        `Assertions for ${suite.name}`.toUpperCase(),
        exportFilepath,
      )
    }
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

  private printIntro(suite: Suite, context: Context): void {
    this.log(
      [
        `Running suite "${suite.name}" with environment "${context.environment.name}" against "${context.environment.host}"`,
        '',
        bold(`Cases to be run for ${suite.name}`.toUpperCase()),
        ...suite.cases.map(({name}) => {
          return `  ${name}`
        }),
        '',
        `There are overall ${this.totalCases} cases with ${this.totalRequests} requests to be run.`,
      ].join('\n'),
      '\n',
    )
  }

  private async runSuiteCase(suiteCase: Case,  context: Context, flags: {dry: boolean, verbose: boolean, export: boolean, captures: boolean, assertions: boolean}): Promise<Response[]> {
    this.log(bold(`[${suiteCase.name}] Starting case`))
    this.pendingCases++
    this.updateSpinnerStatus()
    const startTime = Date.now()
    const responses: Response[] = []
    let _id = 0
    // Run all requests including the delay sequentially
    for await (const request of suiteCase.requests) {
      request._id = _id
      const response = await this.runRequest(suiteCase, request, context, flags)
      responses.push(response)
      _id++
    }

    const durationInMs = Date.now() - startTime
    this.pendingCases--
    this.finishedCases++
    this.updateSpinnerStatus()
    this.log(bold(`[${suiteCase.name}] Finished case in ${this.formatDuration(durationInMs)}`))

    return responses
  }

  private async runRequest(suiteCase: Case, request: Request, context: Context, flags: {dry: boolean, verbose: boolean, captures: boolean, assertions: boolean, export: boolean}): Promise<Response> {
    // Create a stub response for dry runs
    let response = ResponseHelper.emptyResponse(request)

    await this.waitFor(request.delayed)

    this.log(`[${suiteCase.name}] Running ${request.name}`)

    if (!flags.dry) {
      let attempt = 0
      const retries = request.retries ?? 0

      /* eslint-disable no-await-in-loop */
      let doRetry = true
      while (doRetry) {
        const renderedRequest = RequestBuilder.render(suiteCase.name, cloneDeep(request), context)
        if (flags.verbose && attempt === 0) {
          this.log(Printer.request(renderedRequest))
        }

        attempt++
        this.concurrentRunningRequests++
        this.updateSpinnerStatus()
        response = await RequestRunner.run(renderedRequest)
        this.concurrentRunningRequests--
        this.updateSpinnerStatus()
        this.log(dim(`[${suiteCase.name}] Ran ${renderedRequest.name} in ${response.durationInMs}ms`))

        // If it is a single request or the maximum retries (+1) is reached do not retry.
        if ((attempt === 1 && retries === 0) || (attempt === retries + 1)) {
          doRetry = false
        }

        if (doRetry && (response.hasError || response.status === 0)) {
          if (flags.verbose) {
            this.log(Printer.response(response))
          }

          await this.waitFor(renderedRequest.delayed ?? 0)
          this.log(dim(`[${suiteCase.name}] Running ${renderedRequest.name} retry ${attempt} of ${retries}`))
          continue
        }

        this.remainingRequests--
        this.updateSpinnerStatus()

        // If there was no error or no retry is required leave the loop.
        doRetry = false

        if (flags.verbose && (!response.hasError || request.allowError)) {
          this.log(Printer.response(response))
        }

        await this.extract(suiteCase, renderedRequest, response, {context, flags})

        if (flags.export) {
          this.exportRequestAndResponse(context.environment.name, suiteCase.name, request, response)
        }

        if (response.hasError && !request.allowError) {
          this.error(
            [
              `[${suiteCase.name}] Finished request ${request.name} with an error: ${response.error.reason} on ${request.url}`,
              Printer.requestAndResponse(renderedRequest, response, false),
            ].join('\n'),
          )
        }
      }
      /* eslint-ensable no-await-in-loop */
    }

    this.log(`[${suiteCase.name}] Finished ${request.name} with status ${response.status} in ${response.durationInMs}ms`)

    return response
  }

  private async waitFor(delay: number) {
    let counter = 0

    /* eslint-disable no-await-in-loop */
    while (counter < delay) {
      counter = await this.tick(counter)
    }
    /* eslint-enable no-await-in-loop */
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

  private hasAssertions(assertionBag: AssertionBag): boolean {
    const assertions = Object.values(assertionBag).flat()

    return assertions.length > 0
  }

  private async export(
    envName: string,
    name: string,
    assertions: Assertion[],
    captures: Capture[],
  ): Promise<string> {
    this.log(`Generating export for ${name} on ${envName}`)
    const pattern = /\//g
    name = `${envName.replace(pattern, '_')}_${name}`
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

  private exportRequestAndResponse(envName:string, caseName: string, request: Request, response: Response) {
    const pattern = /\//g
    const name = `${envName.replace(pattern, '_')}_${request.name.replace(pattern, '_')}`
    const requestFilename = JsonExport.write(`${name}_rq`, request.data, caseName)
    const responseFilename = JsonExport.write(`${name}_rs`, response.data, caseName)

    this.log(`Exported request to ${requestFilename} and response to ${responseFilename}`)
  }

  private async extract(
    suiteCase: Case,
    request: Request,
    response: Response,
    meta: {
      context: Context,
      flags: {captures: boolean, assertions: boolean}
    },
  ) {
    const context = meta.context
    const flags = meta.flags
    const captures = response.captures.map((capture: Capture) => {
      capture.caseName = suiteCase.name

      return capture
    })
    context.captures = [...context.captures, ...captures]
    if (response.captures.length > 0 && flags.captures) {
      this.printCaptures(response.captures)
    }

    let assertions: Assertion[] = []
    if (request.assertions.length > 0) {
      if (!response.hasError || request.allowError) {
        assertions = Asserter.assert(
          suiteCase.name,
          request.assertions,
          context.captures,
          request._id,
        )
      }

      if (!context.assertions[suiteCase.name]) {
        context.assertions[suiteCase.name] = [] as Assertion[]
      }

      context.assertions[suiteCase.name] = [...context.assertions[suiteCase.name], ...assertions]

      if (flags.assertions) {
        this.printAssertions(assertions)
      }
    }
  }

  private formatDuration(ms: number): string {
    const d = new Date(Date.UTC(0, 0, 0, 0, 0, 0, ms))
    const formatted = [
      d.getUTCHours(),
      d.getUTCMinutes(),
      d.getUTCSeconds(),
    ].map(s => String(s).padStart(2, '0')).join(':')

    return `${formatted}.${d.getUTCMilliseconds()}`
  }

  private updateSpinnerStatus() {
    CliUx.ux.action.status = `\nCASES: ${this.pendingCases} pending ${this.finishedCases} finished\nREQUESTS: ${this.concurrentRunningRequests} running ${this.remainingRequests} remaining`
  }

  private sortByCases(cases: Case[], assertions: AssertionBag): AssertionBag {
    const order = cases.map(({name}) => {
      return name
    })
    const orderedAssertions: AssertionBag = {}

    order.forEach(caseName => {
      if (assertions[caseName]) {
        orderedAssertions[caseName] = assertions[caseName]
      }
    })

    return orderedAssertions
  }
}
