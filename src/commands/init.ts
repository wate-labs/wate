import {Command, flags} from '@oclif/command'
import * as fs from 'fs'

export default class Init extends Command {
  static description = 'Initialize new artes project'

  static examples = ['$ artes init']

  static requestsDir = 'requests'

  static suitesDir = 'suites'

  static envDir = 'envs'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  async run() {
    this.parse(Init)
    const requiredDirs = [Init.requestsDir, Init.suitesDir, Init.envDir]
    requiredDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        this.log(`Found existing ${dir} directory. Exiting.`)
        this.exit(1)
      }
    })
    requiredDirs.forEach(dir => {
      this.log(`Setting up ${dir} directory`)
      fs.mkdirSync(dir)
    })
    this.log(`Setup finished.

Next please add new requests by running: artes new request "my request"`)
  }
}
