import * as fs from 'fs'
import * as path from 'path'
import * as parser from 'http-string-parser'
import * as nunjucks from 'nunjucks'
import Request from '../request'
import Environment from '../environment'
import Param, {KeyValue} from '../param'
import DataHelper from '../data/helper'
import Context from '../context'
import CaptureDefinition, {Capture} from '../capture'

export default class RequestBuilder {
  public static prepare(
    requestPath: string,
    context: Context,
    params: Param[],
    captures: CaptureDefinition[],
  ): Request {
    const request = RequestBuilder.load(path.join(requestPath, 'request.http'))
    const host = context.environment.host ?? request.headers.Host

    return {
      path: requestPath,
      url: request.uri,
      baseURL: context.environment.scheme + '://' + host,
      method: request.method,
      headers: RequestBuilder.headers(request.headers, context.environment),
      data: request.body,
      params,
      captures,
    }
  }

  public static render(request: Request, context: Context): Request {
    const preRequestScript = path.join(request.path, 'pre-request.js')
    let params = RequestBuilder.applyCapturesToParams(request.params, context)
    params = RequestBuilder.applyPreRequestHandling(preRequestScript, params)
    request.headers = RequestBuilder.applyParamsToAll(request.headers, params)
    request.data = RequestBuilder.parse(
      RequestBuilder.applyParams(request.data, params),
    )

    return request
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
    const computedParams: KeyValue = preRequest(null, DataHelper.toKV(params))
    const normalizedParams = DataHelper.toParam(computedParams)

    return [...params, ...normalizedParams]
  }

  private static applyCapturesToParams(
    params: Param[],
    context: Context,
  ): Param[] {
    return params.map(param =>
      RequestBuilder.applyCapturesToParam(param, context.captures),
    )
  }

  private static applyCapturesToParam(
    param: Param,
    captures: Capture[],
  ): Param {
    if (
      typeof param.value === 'string' &&
      param.value.startsWith('$captures.')
    ) {
      const captureName = param.value.replace('$captures.', '')
      const capture = captures.filter(capture => capture.name === captureName)
      if (capture.length !== 1) {
        throw new Error(`Capture ${captureName} ambiguous or not found`)
      }

      return {name: param.name, value: capture[0].value}
    }

    return param
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
    const replacements = DataHelper.toKV(params)
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
