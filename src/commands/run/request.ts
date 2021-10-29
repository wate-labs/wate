import {Command, flags} from '@oclif/command'
import * as Chalk from 'chalk'
import * as path from 'path'
import Context from '../../context'
import EnvironmentLoader from '../../environment/loader'
import RequestRunner from '../../request/runner'
import Request from '../../request'
import Response from '../../response'
import Environment from '../../environment'
import Printer from '../../helpers/printer'
import ResponseHelper from '../../helpers/response'
import RequestBuilder from '../../request/builder'

const {dim} = Chalk

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
    dry: flags.boolean({
      char: 'd',
      description: 'perform a dry run without emitting the request',
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

    const request = this.buildRequest(reqName, context)

    const response = await this.runRequest(request, flags.verbose, flags.dry)

    this.log(
      [
        '',
        dim(`Status code: ${response.status}`),
        dim(`Took ${response.durationInMs}ms`),
      ].join('\n'),
    )
  }

  private buildRequest(reqName: string, context: Context) {
    const request = RequestBuilder.prepare(
      path.join(RequestCommand.reqDir, reqName),
      context,
      [],
      [],
    )

    return RequestBuilder.render(request, context)
  }

  private async runRequest(request: Request, verbose: boolean, dry: boolean) {
    let response: Response = ResponseHelper.emptyResponse(request)
    if (!dry) {
      response = await RequestRunner.run(request)
    }
    if (verbose) {
      this.log(Printer.requestAndResponse(request, response, dry))
    }
    if (response.hasError) {
      this.error(response.error.reason)
    }

    return response
  }

  private buildContext(
    flags: {parameters?: string[]},
    environment: Environment,
  ): Context {
    const context = {
      requestsLocation: RequestCommand.reqDir,
      environment: environment,
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
}
