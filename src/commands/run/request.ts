import {CliUx, Command, Flags} from '@oclif/core'
import * as Chalk from 'chalk'
import * as path from 'node:path'
import Context from '../../context'
import EnvironmentLoader from '../../environment/loader'
import RequestRunner from '../../request/runner'
import Request from '../../request'
import Response from '../../response'
import Environment from '../../environment'
import Printer from '../../helpers/printer'
import ResponseHelper from '../../helpers/response'
import RequestBuilder from '../../request/builder'
import CaptureDefinition, {Capture} from '../../capture'
import Param from '../../param'

const {dim} = Chalk

export default class RequestCommand extends Command {
  static args = [
    {name: 'environment', description: 'environment to use', required: true},
    {name: 'request', description: 'name of the request', required: true},
  ];

  static flags = {
    help: Flags.help({char: 'h'}),
    verbose: Flags.boolean({
      char: 'v',
      description: 'print the raw response headers and body',
    }),
    dry: Flags.boolean({
      char: 'd',
      description: 'perform a dry run without emitting the request',
    }),
    parameters: Flags.string({
      char: 'p',
      description: 'use given parameter name and value in request',
      multiple: true,
    }),
    captures: Flags.string({
      char: 'c',
      description: 'capture value from response with given JSONPath expression',
      multiple: true,
    }),
  };

  static description = 'run an existing request';

  static examples = ['$ wate run:request test ping'];

  static envDir = 'environments';

  static reqDir = 'requests';

  async run() {
    const {args, flags} = await this.parse(RequestCommand)
    const envName = args.environment
    const reqName = args.request
    const environment = EnvironmentLoader.load(RequestCommand.envDir, envName)
    this.log(
      `Running request "${reqName}" with environment "${envName}" against "${environment.host}"`,
    )

    const context = this.buildContext(environment)
    const params = this.buildParams(flags)
    const captures = this.buildCaptures(flags)

    const request = this.buildRequest(reqName, params, captures, context)

    const response = await this.runRequest(request, flags.verbose, flags.dry)

    if (response.captures.length > 0) {
      this.printCaptures(response.captures)
    }

    this.log(
      [
        '',
        dim(`Status code: ${response.status}`),
        dim(`Took ${response.durationInMs}ms`),
      ].join('\n'),
    )
  }

  private buildRequest(
    reqName: string,
    params: Param[],
    captures: CaptureDefinition[],
    context: Context,
  ) {
    const request = RequestBuilder.prepare(
      path.join(RequestCommand.reqDir, reqName),
      0,
      context,
      params,
      {
        captures,
        assertions: [],
      },
    )

    return RequestBuilder.render('n/a', request, context)
  }

  private async runRequest(request: Request, verbose: boolean, dry: boolean) {
    let response: Response = ResponseHelper.emptyResponse(request)
    if (verbose) {
      this.log(Printer.request(request))
    }

    if (!dry) {
      response = await RequestRunner.run(request)
    }

    if (verbose) {
      this.log(Printer.response(response))
    }

    if (response.hasError) {
      this.error(response.error.reason)
    }

    return response
  }

  private buildContext(environment: Environment): Context {
    return {
      requestsLocation: RequestCommand.reqDir,
      environment: environment,
      params: [],
      captures: [],
      assertions: [],
    }
  }

  private buildParams(flags: { parameters?: string[] }): Param[] {
    let params: Param[] = []
    if (flags.parameters) {
      flags.parameters.forEach((raw: string) => {
        const [name, value] = raw.split('=')
        params = [...params, {name, value}]
      })
    }

    return params
  }

  private buildCaptures(flags: { captures?: string[] }): CaptureDefinition[] {
    let captures: CaptureDefinition[] = []
    if (flags.captures) {
      flags.captures.forEach((raw: string) => {
        const [name, expression] = raw.split('=')
        captures = [...captures, {name, expression}]
      })
    }

    return captures
  }

  private printCaptures(captures: Capture[]) {
    this.log(['', 'Captured values'.toUpperCase(), ''].join('\n'))
    CliUx.ux.table(
      captures.map(({name, value}) => {
        let printValue = value
        if (typeof value === 'object' || Array.isArray(value)) {
          printValue = Printer.prettify(value)
        }

        return {name, value: printValue}
      }),
      {name: {}, value: {}},
      {'no-truncate': true},
    )
    this.log('')
  }
}
