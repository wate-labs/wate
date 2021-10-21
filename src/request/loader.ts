import * as path from 'path'
import RequestBuilder from './builder'
import Request from '../request'
import Context from '../context'

export default class RequestLoader {
  public static load(reqPath: string, name: string, context: Context): Request {
    return RequestBuilder.build(
      path.join(reqPath, name),
      context.environment,
      context.params,
      [],
    )
  }
}
