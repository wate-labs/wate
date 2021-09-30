import {Command, flags} from '@oclif/command'
import * as Chalk from 'chalk'
import Context from '../../context'
import EnvironmentLoader from '../../environment/loader'
import ResponsePrinter from '../../response/printer'
import SuiteLoader from '../../suite/loader'
import Request from '../../request'
import Response from '../../response'
import RequestRunner from '../../request/runner'
import {Case} from '../../suite'

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
  }

  static description = 'run an existing suite'

  static examples = ['$ artes run:suite test suite']

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
    if (flags.dry) {
      this.log(
        dim(
          `Suite "${suite.name}" contains ${caseCount} test cases with ${requestCount} requests`,
        ),
      )
      this.exit(0)
    }
    for await (const suiteCase of suite.cases) {
      await this.runCase(suiteCase, flags.verbose)
    }
    const durationInMs = Date.now() - startTime
    this.log(
      [
        dim(
          `Suite "${suite.name}" contains ${caseCount} test cases with ${requestCount} requests and was run in ${durationInMs}ms`,
        ),
      ].join('\n'),
    )
  }

  private buildContext(
    flags: {parameters?: string[]},
    envName: string,
  ): Context {
    const context = {
      requestsLocation: SuiteCommand.reqDir,
      environment: EnvironmentLoader.load(SuiteCommand.envDir, envName),
      params: [],
    } as Context
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
    verbose: boolean,
  ): Promise<Response[]> {
    const startTime = Date.now()
    this.log(`Starting ${suiteCase.name}`)
    const responses: Response[] = []
    for await (const request of suiteCase.requests) {
      const response = await this.runRequest(suiteCase.name, request, verbose)
      responses.push(response)
    }
    const durationInMs = Date.now() - startTime
    this.log(`Finished ${suiteCase.name} in ${durationInMs}ms`, '\n')

    return responses
  }

  private async runRequest(
    caseName: string,
    request: Request,
    verbose: boolean,
  ) {
    this.log(dim(`[${caseName}] Running (${request.url})`))
    const response = await RequestRunner.run(request)
    if (verbose) {
      this.printRaw(request, response)
    }
    if (response.hasError) {
      this.error(response.error.reason)
    }
    this.log(
      [
        dim(
          `[${caseName}] Finished with status ${response.status} in ${response.durationInMs}ms`,
        ),
      ].join('\n'),
    )

    return response
  }

  private printRaw(originalRequest: Request, rawResponse: Response) {
    const {request, response} = ResponsePrinter.print(rawResponse)
    this.log(
      [
        '',
        dim(`URL: ${originalRequest.url}`),
        '',
        bold('REQUEST'),
        dim('headers'),
        request.headers,
        dim('body'),
        request.body,
        '',
        bold('RESPONSE'),
        dim('headers'),
        response.headers,
        dim('body'),
        response.body,
        '',
      ].join('\n'),
    )
  }
}
