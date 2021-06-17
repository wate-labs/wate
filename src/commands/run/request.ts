import {Command, flags} from '@oclif/command'
import * as fs from 'fs'
import * as path from 'path'

export default class Request extends Command {
  static args = [
    {name: 'environment', description: 'environment to use'},
    {name: 'request', description: 'name of the request'},
  ]

  static flags = {
    help: flags.help({char: 'h'}),
  }

  static description = 'run an existing request'

  static examples = ['$ artes run:request test ping']

  static dir = 'requests'

  async run() {
    const {args} = this.parse(Request)
    const requestName = args.request
    const requestPath = path.join(Request.dir, requestName)
    if (!fs.existsSync(requestPath)) {
      this.error(`Request "${requestName}" not found.`)
    }
  }
}
