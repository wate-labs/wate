import {Command, flags} from '@oclif/command'
import * as fs from 'fs'

export default class InitCommand extends Command {
  static description = 'initialize new wate project'

  static examples = ['$ wate init']

  static requestsDir = 'requests'

  static suitesDir = 'suites'

  static environmentsDir = 'environments'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  async run() {
    this.parse(InitCommand)
    const requiredDirs = [
      InitCommand.requestsDir,
      InitCommand.suitesDir,
      InitCommand.environmentsDir,
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

Next please add new requests by running: wate create:request "my request"`)
  }
}
