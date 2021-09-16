import * as fs from 'fs'
import * as path from 'path'
import * as parser from 'http-string-parser'
import * as nunjucks from 'nunjucks'
import Request from '../request'
import Environment from '../environment'

export default class RequestBuilder {
  public static build(
    requestPath: string,
    environment: Environment,
    params: {[key: string]: string} = {},
  ): Request {
    const request = RequestBuilder.load(path.join(requestPath, 'request.http'))
    request.headers = RequestBuilder.applyParamsToAll(request.headers, params)
    request.body = RequestBuilder.applyParams(request.body, params)

    const host = environment.host ?? request.headers.Host

    return {
      url: request.uri,
      baseURL: environment.scheme + '://' + host,
      method: request.method,
      headers: RequestBuilder.headers(request.headers, environment),
      data: RequestBuilder.parse(request.body),
    }
  }

  private static load(requestPath: string): parser.ParseRequestResult {
    const rawRequest = fs.readFileSync(requestPath)

    return parser.parseRequest(rawRequest.toString())
  }

  private static headers(headers: any, environment: Environment): object {
    return {
      ...headers,
      Host: environment.host ?? headers.Host,
    }
  }

  private static parse(data: string) {
    try {
      return JSON.parse(data)
    } catch (error) {
      return data
    }
  }

  private static applyParamsToAll(
    data: {[key: string]: string},
    params: {[key: string]: string},
  ): {[key: string]: string} {
    Object.entries(data).forEach(([key, value]) => {
      data[key] = RequestBuilder.applyParams(value, params)
    })
    return data
  }

  private static applyParams(
    data: string,
    params: {[key: string]: string},
  ): string {
    nunjucks.configure({autoescape: false})

    return nunjucks.renderString(data, params)
  }
}
