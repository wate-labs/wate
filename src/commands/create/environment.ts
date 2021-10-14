import {Command, flags} from '@oclif/command'
import * as fs from 'fs'
import * as path from 'path'

export default class EnvironmentCommand extends Command {
  static args = [
    {
      name: 'environmentName',
      description: 'name of the environment, e.g. my_collection/my_environment',
      required: true,
    },
  ]

  static description = 'create new environment'

  static examples = ['$ artes create:environment']

  static dir = 'environments'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  async run() {
    const {args} = this.parse(EnvironmentCommand)
    const name = `${args.environmentName}`
    if (!fs.existsSync(EnvironmentCommand.dir)) {
      this.error(`Directory "${EnvironmentCommand.dir}" not found.`)
    }

    const relativePath = `${name}.json`
    const fileName = path.basename(relativePath)
    const fullPath = path.join(EnvironmentCommand.dir, relativePath)
    const environmentPath = path.dirname(fullPath)

    if (fs.existsSync(fullPath)) {
      this.error(`Environment "${name}" (${fullPath}) already exists.`)
    }
    fs.mkdirSync(environmentPath, {recursive: true})
    fs.copyFileSync(
      path.join(__dirname, '../../', 'templates', 'environment.json'),
      path.join(environmentPath, fileName),
    )
    this.log(`Created "${name}" located at "${environmentPath}"`)
  }
}