import {Command, flags} from '@oclif/command'
import * as Chalk from 'chalk'
import EnvironmentLoader from '../../environment/loader'
import RequestLoader from '../../request/loader'
import Runner from '../../request/runner'
import Response from '../../response'
import ResponsePrinter from '../../response/printer'

const {bold, dim} = Chalk

export default class Request extends Command {
  static args = [
    {name: 'environment', description: 'environment to use', required: true},
    {name: 'request', description: 'name of the request', required: true},
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    print: flags.boolean({
      char: 'p',
      description: 'print the raw response headers and body',
    }),
  }

  static description = 'run an existing request'

  static examples = ['$ artes run:request test ping']

  static envDir = 'environments'

  static reqDir = 'requests'

  async run() {
    const {args, flags} = this.parse(Request)
    const envName = args.environment
    const reqName = args.request
    const environment = EnvironmentLoader.load(Request.envDir, envName)
    this.log(
      `Running request "${reqName}" with environment "${envName}" against "${environment.host}"`,
    )
    const request = RequestLoader.load(Request.reqDir, reqName, environment)
    const rawResponse = await Runner.run(request)
    if (flags.print) {
      this.printRaw(rawResponse)
    }
    if (rawResponse.hasError) {
      this.error(rawResponse.error.reason)
    }
    this.log(
      [
        '',
        dim(`Status code: ${rawResponse.status}`),
        dim(`Took ${rawResponse.durationInMs}ms`),
      ].join('\n'),
    )
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
