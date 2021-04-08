import {Environment} from '../environment'
import * as fs from 'fs'
import * as parser from 'http-string-parser'

export default class RequestBuilder {
  public static build(requestPath: string, environment: Environment): Request {
    const request = RequestBuilder.load(requestPath)
    const host = environment.host ?? request.headers.Host
    return {
      url: request.uri,
      baseURL: environment.scheme + '://' + host,
      method: request.method,
      headers: RequestBuilder.headers(request.headers, environment),
      data: request.body,
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
}

export interface Request {
  url: string;
  baseURL: string;
  method: string;
  headers: any;
  data: any;
}
