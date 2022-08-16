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
import {Case} from '../../suite'
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

    const casePromises = Object.values(suite.cases).map(async suiteCase => {
      if (suiteCase.delayed) {
        this.log(dim(`[${suiteCase.name}] Queued with a delay of ${suiteCase.delayed ?? 0} ticks`))
        await this.waitFor(suiteCase.delayed)
      }

      this.log(dim(`[${suiteCase.name}] Starting case`))
      const startTime = Date.now()
      const responses: Response[] = []
      // Run all requests including the delay sequentially
      for await (const request of suiteCase.requests) {
        this.log(dim(`[${suiteCase.name}] Queued ${request.name} with a delay of ${request.delayed ?? 0} ticks`))
        // Create a stub response for dry runs
        let response = ResponseHelper.emptyResponse(request)

        await this.waitFor(request.delayed)

        this.log(dim(`[${suiteCase.name}] Running ${request.name}`))

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

            ++attempt
            response = await RequestRunner.run(renderedRequest)
            this.log(dim(`[${suiteCase.name}] Ran ${renderedRequest.name} in ${response.durationInMs}ms`))

            // If a single request or the maximum retries (+1) is reqched do not retry.
            if ((attempt === 1 && retries === 0) || (attempt === retries + 1)) {
              doRetry = false
            }

            if (doRetry && (response.hasError || response.status === 0)) {
              await this.waitFor(renderedRequest.delayed ?? 0)
              this.log(dim(`[${suiteCase.name}] Running ${renderedRequest.name} retry ${attempt} of ${retries}`))
              continue
            }

            // If there was no error or no retry is required leave the loop.
            doRetry = false

            if (flags.verbose && !response.hasError) {
              this.log(Printer.response(response))
            }

            await this.extract(suiteCase, renderedRequest, response, context, flags)

            if (flags.export) {
              this.exportRequestAndResponse(suiteCase.name, request, response)
            }

            if (response.hasError) {
              this.error(
                [
                  `[${suiteCase.name}] Finished request ${request.name} with an error: ${response.error.reason} on ${request.url}`,
                  Printer.requestAndResponse(renderedRequest, response, false),
                ].join('\n'),
              )
            }
          }
          /* eslint-ensable no-await-in-loop */

          responses.push(response)
          this.log(dim(`[${suiteCase.name}] Finished ${request.name} with status ${response.status} in ${response.durationInMs}ms`))
        }
      }

      const durationInMs = Date.now() - startTime
      this.log(dim(`[${suiteCase.name}] Finished case in ${durationInMs}ms`))

      return responses
    })
    await Promise.all(casePromises)

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
    const name = request.name.replace(pattern, '_')
    const requestFilename = JsonExport.write(`${name}_rq`, request.data, caseName)
    const responseFilename = JsonExport.write(`${name}_rs`, response.data, caseName)

    this.log(`Exported request to ${requestFilename} and response to ${responseFilename}`)
  }

  private async extract(suiteCase: Case, request: Request, response: Response, context: Context, flags: {captures: boolean, assertions: boolean}) {
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
      if (!response.hasError) {
        assertions = Asserter.assert(
          suiteCase.name,
          request.assertions,
          context.captures,
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
}
