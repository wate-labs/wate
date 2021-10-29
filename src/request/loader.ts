import * as path from 'path'
import RequestBuilder from './builder'
import Request from '../request'
import Context from '../context'

export default class RequestLoader {
  public static load(
    requestPath: string,
    name: string,
    context: Context,
  ): Request {
    const request = RequestBuilder.prepare(
      path.join(requestPath, name),
      context,
      [],
      [],
    )

    return RequestBuilder.render(request, context)
  }
}
