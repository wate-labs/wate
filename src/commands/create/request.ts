import {Command, Flags} from '@oclif/core'
import * as fs from 'node:fs'
import * as path from 'node:path'

export default class RequestCommand extends Command {
  static args = [
    {
      name: 'requestName',
      description: 'name of the request, e.g. my_collection/my_request',
      required: true,
    },
  ]

  static description = 'create new request'

  static examples = ['$ wate create:request']

  static dir = 'requests'

  static flags = {
    help: Flags.help({char: 'h'}),
  }

  async run() {
    const {args} = await this.parse(RequestCommand)
    const requestName = args.requestName
    if (!fs.existsSync(RequestCommand.dir)) {
      this.error(`Directory "${RequestCommand.dir}" not found.`)
    }

    const requestPath = path.join(RequestCommand.dir, requestName)
    if (fs.existsSync(requestPath)) {
      this.error(`Request "${requestName}" (${requestPath}) already exists.`)
    }

    fs.mkdirSync(requestPath, {recursive: true})

    fs.writeFileSync(
      path.join(requestPath, 'request.http'),
      this.getHttpTemplate(),
    )
    fs.writeFileSync(
      path.join(requestPath, 'pre-request.js'),
      this.getPreRequestTemplate(),
    )
    this.log(`Created "${requestName}" located under ${requestPath}`)
  }

  private getHttpTemplate(): string {
    return `GET /get?query_param=value HTTP/1.1
Host: my-host.tld
Content-Type: text/plain
Content-Length: 27

{
    "property": "value"
}`
  }

  private getPreRequestTemplate(): string {
    return `module.exports = (_captures, _parameters) => {
  // Use the captures to retrieve data from previous requests
  // Use the parameter to retrieve the defined parameters
  // Return key value parts of the parameters to use
  return {}
}`
  }
}
