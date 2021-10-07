import {Command, flags} from '@oclif/command'
import * as Chalk from 'chalk'
import Context from '../../context'
import EnvironmentLoader from '../../environment/loader'
import RequestLoader from '../../request/loader'
import RequestRunner from '../../request/runner'
import Request from '../../request'
import Response from '../../response'
import ResponsePrinter from '../../response/printer'
import Environment from '../../environment'

const {bold, dim} = Chalk

export default class RequestCommand extends Command {
  static args = [
    {name: 'environment', description: 'environment to use', required: true},
    {name: 'request', description: 'name of the request', required: true},
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

  static description = 'run an existing request'

  static examples = ['$ artes run:request test ping']

  static envDir = 'environments'

  static reqDir = 'requests'

  async run() {
    const {args, flags} = this.parse(RequestCommand)
    const envName = args.environment
    const reqName = args.request
    const environment = EnvironmentLoader.load(RequestCommand.envDir, envName)
    this.log(
      `Running request "${reqName}" with environment "${envName}" against "${environment.host}"`,
    )

    const context = this.buildContext(flags, environment)

    const request = RequestLoader.load(RequestCommand.reqDir, reqName, context)

    const response = await this.runRequest(request, flags.verbose)

    this.log(
      [
        '',
        dim(`Status code: ${response.status}`),
        dim(`Took ${response.durationInMs}ms`),
      ].join('\n'),
    )
  }

  private async runRequest(request: Request, verbose: boolean) {
    const response = await RequestRunner.run(request)
    if (verbose) {
      this.printRaw(response)
    }
    if (response.hasError) {
      this.error(response.error.reason)
    }

    return response
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

  private buildContext(
    flags: {parameters?: string[]},
    environment: Environment,
  ): Context {
    const context = {
      requestsLocation: RequestCommand.reqDir,
      environment: environment,
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
}
