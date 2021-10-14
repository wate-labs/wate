import * as fs from 'fs'
import * as path from 'path'
import * as parser from 'http-string-parser'
import * as nunjucks from 'nunjucks'
import Request from '../request'
import Environment from '../environment'
import Param, {KeyValue} from '../param'
import ParamHelper from '../param/helper'

export default class RequestBuilder {
  public static build(
    requestPath: string,
    environment: Environment,
    params: Param[],
  ): Request {
    const request = RequestBuilder.load(path.join(requestPath, 'request.http'))
    const preRequestScript = path.join(requestPath, 'pre-request.js')
    params = RequestBuilder.applyPreRequestHandling(preRequestScript, params)
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

  private static applyPreRequestHandling(
    preRequestPath: string,
    params: Param[],
  ): Param[] {
    if (!fs.existsSync(preRequestPath)) {
      return params
    }
    const fullPath = path.resolve(preRequestPath)
    const preRequest = require(fullPath)
    const computedParams: KeyValue = preRequest(null, ParamHelper.toKV(params))
    const normalizedParams = ParamHelper.toParam(computedParams)

    return [...params, ...normalizedParams]
  }

  private static applyParamsToAll(
    data: {[key: string]: string},
    params: Param[],
  ): {[key: string]: string} {
    Object.entries(data).forEach(([key, value]) => {
      data[key] = RequestBuilder.applyParams(value, params)
    })

    return data
  }

  private static applyParams(data: string, params: Param[]): string {
    const replacements = ParamHelper.toKV(params)
    RequestBuilder.validateVariables(data, replacements)
    nunjucks.configure({autoescape: false, throwOnUndefined: true})
    const template = new nunjucks.Template(data)

    return template.render(replacements)
  }

  private static validateVariables(data: string, replacements: {}) {
    const variablesRegex = /{{\s?([\w]+)((?:\..+)|(?:\[.+)?)\s?}}/g
    const variables = [...data.matchAll(variablesRegex)].map(
      ([_, name]) => name,
    )
    const given = Object.keys(replacements)
    const diff = variables.filter(name => !given.includes(name))

    if (diff.length > 0) {
      throw new Error(`The following variables are missing: ${diff}`)
    }
  }
}
