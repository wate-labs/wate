import {Command, flags} from '@oclif/command'
import * as Chalk from 'chalk'
import EnvironmentLoader from '../../environment/loader'
import RequestLoader from '../../request/loader'
import Runner from '../../runner'
import ResponsePrinter from '../../response/printer'

const {bold, italic} = Chalk

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
      const {request, response} = ResponsePrinter.print(rawResponse)
      this.log(
        [
          bold('REQUEST'),
          italic('headers'),
          request.headers,
          italic('body'),
          request.body,
          bold('RESPONSE'),
          italic('headers'),
          response.headers,
          italic('body'),
          response.body,
        ].join('\n'),
      )
    }
  }
}
