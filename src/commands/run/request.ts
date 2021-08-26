import {Command, flags} from '@oclif/command'
import * as fs from 'fs'
import * as path from 'path'
import EnvironmentLoader from '../../loader/environment'

export default class Request extends Command {
  static args = [
    {name: 'environment', description: 'environment to use', required: true},
    {name: 'request', description: 'name of the request', required: true},
  ]

  static flags = {
    help: flags.help({char: 'h'}),
  }

  static description = 'run an existing request'

  static examples = ['$ artes run:request test ping']

  static envDir = 'environments'

  static reqDir = 'requests'

  async run() {
    const {args} = this.parse(Request)
    const envName = args.environment
    const reqName = args.request
    const environment = EnvironmentLoader.load(Request.envDir, envName)
    this.loadReq(reqName)
    this.log(
      `Running request "${reqName}" with environment "${envName}" against "${environment.host}"`
    )
  }

  loadReq(name: string) {
    const resolvedPath = path.join(Request.reqDir, name)
    if (!fs.existsSync(resolvedPath)) {
      this.error(`Request "${name}" not found.`)
    }
  }
}
