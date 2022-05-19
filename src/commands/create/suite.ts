import {Command, Flags} from '@oclif/core'
import * as fs from 'node:fs'
import * as path from 'node:path'

export default class SuiteCommand extends Command {
  static args = [
    {
      name: 'suiteName',
      description: 'name of the suite, e.g. my_collection/my_suite',
      required: true,
    },
  ]

  static description = 'create new suite'

  static examples = ['$ wate create:suite']

  static dir = 'suites'

  static flags = {
    help: Flags.help({char: 'h'}),
  }

  async run() {
    const {args} = await this.parse(SuiteCommand)
    const name = `${args.suiteName}`
    if (!fs.existsSync(SuiteCommand.dir)) {
      this.error(`Directory "${SuiteCommand.dir}" not found.`)
    }

    const relativePath = `${name}.yaml`
    const fileName = path.basename(relativePath)
    const fullPath = path.join(SuiteCommand.dir, relativePath)
    const suitePath = path.dirname(fullPath)

    if (fs.existsSync(fullPath)) {
      this.error(`Suite "${name}" (${fullPath}) already exists.`)
    }

    fs.mkdirSync(suitePath, {recursive: true})
    fs.writeFileSync(path.join(suitePath, fileName), this.getTemplate())
    this.log(`Created "${name}" located at "${suitePath}"`)
  }

  private getTemplate(): string {
    return `name: My suite name
cases:
  - name: My test case
    requests:
      - request: my_request
`
  }
}
