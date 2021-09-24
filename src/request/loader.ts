import * as path from 'path'
import Environment from '../environment'
import RequestBuilder from './builder'
import Request from '../request'
import Context from '../context'

export default class RequestLoader {
  public static load(
    reqPath: string,
    name: string,
    environment: Environment,
    context: Context,
  ): Request {
    return RequestBuilder.build(path.join(reqPath, name), environment, context)
  }
}
