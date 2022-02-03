import {dim, bold} from 'chalk'
import Request from '../request'
import Response from '../response'
import ResponseValidator from '../response/validator'

export default class Printer {
  public static prettify(data: any): string {
    return JSON.stringify(data, null, 2)
  }

  public static request(rawRequest: Request): string {
    const request = Printer.parse(rawRequest)
    return [
      '',
      dim(`URL: ${rawRequest.url}`),
      '',
      bold('REQUEST'),
      dim('headers'),
      request.headers,
      dim('body'),
      request.body,
    ].join('\n')
  }

  public static response(rawResponse: Response): string {
    ResponseValidator.validate(rawResponse)
    const response = Printer.parse(rawResponse)
    return [
      '',
      bold('RESPONSE'),
      dim('headers'),
      response.headers,
      dim('body'),
      response.body,
      '',
    ].join('\n')
  }

  public static requestAndResponse(
    originalRequest: Request,
    rawResponse: Response,
    dry: boolean,
  ): string {
    ResponseValidator.validate(rawResponse)
    const request = Printer.parse(originalRequest)
    const response = Printer.parse(rawResponse)
    let content = [
      '',
      dim(`URL: ${originalRequest.url}`),
      '',
      bold('REQUEST'),
      dim('headers'),
      request.headers,
      dim('body'),
      request.body,
    ]

    if (dry) {
      content = [
        ...content,
        '',
        dim('Dry runs do not have a response'),
        '',
      ]
    }

    if (!dry) {
      content = [
        ...content,

        '',
        bold('RESPONSE'),
        dim('headers'),
        response.headers,
        dim('body'),
        response.body,
        '',
      ]
    }

    return content.join('\n')
  }

  private static parse({headers, data}: any): RequestOrResponse {
    return {
      headers: Printer.prettify(headers),
      body: Printer.prettify(data),
    }
  }
}
interface RequestOrResponse {
  headers: string;
  body: string;
}
