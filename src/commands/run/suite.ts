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
    for await (const suiteCase of suite.cases) {
      await this.runCase(suiteCase, context, flags)
    }
    const durationInMs = Date.now() - startTime
    if (context.captures.length > 0) {
      this.printCaptures(
        context.captures,
        `Summary for ${suite.name}`.toUpperCase(),
      )
    }
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
      captures: [],
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
    context: Context,
    flags: {verbose: boolean; dry: boolean; captures: boolean},
  ): Promise<Response[]> {
    const startTime = Date.now()
    this.log(`Starting case ${suiteCase.name}`)
    const responses: Response[] = []
    for await (const request of suiteCase.requests) {
      let response: Response = ResponseHelper.emptyResponse(request)

      if (!flags.dry) {
        response = await this.runRequest(
          suiteCase.name,
          request,
          context,
          flags.captures,
        )
      }

      if (flags.verbose) {
        this.log(Printer.requestAndResponse(request, response, flags.dry))
      }
      if (response.hasError) {
        this.error(response.error.reason)
      }

      responses.push(response)
    }
    const durationInMs = Date.now() - startTime
    this.log(`Finished case ${suiteCase.name} in ${durationInMs}ms`, '\n')

    return responses
  }

  private async runRequest(
    caseName: string,
    request: Request,
    context: Context,
    printCaptures: boolean,
  ) {
    this.log(dim(`[${caseName}] Running (${request.url})`))
    request = RequestBuilder.render(request, context)
    const response = await RequestRunner.run(request)
    context.captures = [...context.captures, ...response.captures]
    this.log(
      [
        dim(
          `[${caseName}] Finished with status ${response.status} in ${response.durationInMs}ms`,
        ),
      ].join('\n'),
    )

    if (response.captures.length > 0 && printCaptures) {
      this.printCaptures(response.captures)
    }

    return response
  }

  private printCaptures(captures: Capture[], title?: string) {
    this.log(['', title || 'Captured values'.toUpperCase(), ''].join('\n'))
    cli.table(captures, {name: {}, value: {}})
    this.log('')
  }
}
