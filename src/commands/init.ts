import {Command, flags} from '@oclif/command'
import * as fs from 'fs'

export default class Init extends Command {
  static description = 'initialize new artes project'

  static examples = ['$ artes init']

  static requestsDir = 'requests'

  static suitesDir = 'suites'

  static environmentsDir = 'environments'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  async run() {
    this.parse(Init)
    const requiredDirs = [
      Init.requestsDir,
      Init.suitesDir,
      Init.environmentsDir,
    ]
    requiredDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        this.error(`Found existing ${dir} directory.`)
      }
    })
    requiredDirs.forEach(dir => {
      this.log(`Creating ${dir} directory`)
      fs.mkdirSync(dir)
    })
    this.log(`Setup finished.

Next please add new requests by running: artes create:request "my request"`)
  }
}
