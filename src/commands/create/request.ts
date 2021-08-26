import {Command, flags} from '@oclif/command'
import * as fs from 'fs'
import * as path from 'path'

export default class Request extends Command {
  static args = [{name: 'requestName', description: 'name of the request'}]

  static description = 'create new request'

  static examples = ['$ artes create:request']

  static dir = 'requests'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  async run() {
    const {args} = this.parse(Request)
    const requestName = args.requestName
    if (!fs.existsSync(Request.dir)) {
      this.error(`Directory "${Request.dir}" not found.`)
    }
    const requestPath = path.join(Request.dir, requestName)
    if (fs.existsSync(requestPath)) {
      this.error(`Request "${requestName}" (${requestPath}) already exists.`)
    }
    fs.mkdirSync(requestPath, {recursive: true})
    fs.copyFileSync(
      path.join(__dirname, '../../', 'templates', 'request.http'),
      path.join(requestPath, 'request.http'),
    )
    fs.copyFileSync(
      path.join(__dirname, '../../', 'templates', 'pre-request.js'),
      path.join(requestPath, 'pre-request.js'),
    )
    fs.copyFileSync(
      path.join(__dirname, '../../', 'templates', 'post-response.js'),
      path.join(requestPath, 'post-response.js'),
    )
    this.log(`Created "${requestName}" located under ${requestPath}`)
  }
}
