import {Command, flags} from '@oclif/command'
import EnvironmentLoader from '../../loader/environment'
import RequestLoader from '../../request/loader'
import Runner from '../../runner'
import ResponsePrinter from '../../response/printer'

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
    const response = await Runner.run(request)
    if (flags.print) {
      const {headers, body} = ResponsePrinter.print(response)
      this.log(`headers: ${headers}`)
      this.log(`body: ${body}`)
    }
  }
}
