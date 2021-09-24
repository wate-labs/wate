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

export default class Suite extends Command {
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
  }

  static description = 'run an existing suite'

  static examples = ['$ artes run:suite test suite']

  static envDir = 'environments'

  static reqDir = 'requests'

  static suiteDir = 'suites'

  async run() {
    const {args, flags} = this.parse(Suite)
    const envName = args.environment
    const suiteName = args.suite
    const environment = EnvironmentLoader.load(Suite.envDir, envName)
    this.log(
      dim(
        `Running suite "${suiteName}" with environment "${envName}" against "${environment.host}"`,
      ),
    )
    const context = this.buildContext(flags, envName)
    const startTime = Date.now()
    const suite = SuiteLoader.load(Suite.suiteDir, suiteName, context)
    this.log(
      bold('CASES'),
      '\n',
      suite.cases
      .map(({name}) => {
        return name
      })
      .join('\n'),
    )
    suite.cases.forEach(testCase => {
      this.runRequests(testCase.requests, flags.verbose)
    })
    // TODO Handle responses
    const caseCount = suite.cases.length
    const requestCount = 20
    const durationInMs = Date.now() - startTime
    this.log(
      [
        '',
        dim(
          `Performed ${caseCount} test cases and ${requestCount} requests in ${durationInMs}ms`,
        ),
      ].join('\n'),
    )
  }

  private buildContext(
    flags: {parameters?: Array<string>},
    envName: string,
  ): Context {
    const context = {
      requestsFolder: 'requests',
      environment: EnvironmentLoader.load(Suite.envDir, envName),
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

  private runRequests(requests: Request[], verbose: boolean): Response[] {
    const responses: Response[] = []
    requests.forEach(async request => {
      const rawResponse = await RequestRunner.run(request)
      if (verbose) {
        this.printRaw(rawResponse)
      }
      if (rawResponse.hasError) {
        this.error(rawResponse.error.reason)
      }
      responses.push(rawResponse)
    })

    return responses
  }

  private printRaw(rawResponse: Response) {
    const {request, response} = ResponsePrinter.print(rawResponse)
    this.log(
      [
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
      ].join('\n'),
    )
  }
}
