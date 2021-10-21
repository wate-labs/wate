import {dim, bold} from 'chalk'
import ResponsePrinter from '../response/printer'
import Request from '../request'
import Response from '../response'

export default class Printer {
  public static requestAndResponse(
    originalRequest: Request,
    rawResponse: Response,
    dry: boolean,
  ): string {
    const {request, response} = ResponsePrinter.print(rawResponse)
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
        ...['', dim('Dry runs do not have a response'), ''],
      ]
    }

    if (!dry) {
      content = [
        ...content,
        ...[
          '',
          bold('RESPONSE'),
          dim('headers'),
          response.headers,
          dim('body'),
          response.body,
          '',
        ],
      ]
    }

    return content.join('\n')
  }
}
