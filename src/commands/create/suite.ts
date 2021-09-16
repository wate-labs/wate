import {Command, flags} from '@oclif/command'
import * as fs from 'fs'
import * as path from 'path'

export default class Suite extends Command {
  static args = [
    {
      name: 'suiteName',
      description: 'name of the suite, e.g. my_collection/my_suite',
      required: true,
    },
  ]

  static description = 'create new suite'

  static examples = ['$ artes create:suite']

  static dir = 'suites'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  async run() {
    const {args} = this.parse(Suite)
    const name = `${args.suiteName}`
    if (!fs.existsSync(Suite.dir)) {
      this.error(`Directory "${Suite.dir}" not found.`)
    }

    const relativePath = `${name}.json`
    const fileName = path.basename(relativePath)
    const fullPath = path.join(Suite.dir, relativePath)
    const suitePath = path.dirname(fullPath)

    if (fs.existsSync(fullPath)) {
      this.error(`Suite "${name}" (${fullPath}) already exists.`)
    }
    fs.mkdirSync(suitePath, {recursive: true})
    fs.copyFileSync(
      path.join(__dirname, '../../', 'templates', 'suite.json'),
      path.join(suitePath, fileName),
    )
    this.log(`Created "${name}" located at "${suitePath}"`)
  }
}
