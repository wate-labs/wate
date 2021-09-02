import * as path from 'path'
import Environment from '../environment'
import RequestBuilder from './builder'
import Request from '../request'

export default class RequestLoader {
  public static load(
    reqPath: string,
    name: string,
    environment: Environment,
  ): Request {
    return RequestBuilder.build(
      path.join(reqPath, name, 'request.http'),
      environment,
    )
  }
}
