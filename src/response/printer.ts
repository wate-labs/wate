import Response from '../response'
import ResponseValidator from '../response/validator'

export default class ResponsePrinter {
  public static print(response: Response): RequestAndResponse {
    ResponseValidator.validate(response)

    return {
      request: ResponsePrinter.buildFrom(response.request),
      response: ResponsePrinter.buildFrom(response),
    } as RequestAndResponse
  }

  private static buildFrom({headers, data}: any): RequestOrResponse {
    return {
      headers: ResponsePrinter.prettify(headers),
      body: ResponsePrinter.prettify(data),
    } as RequestOrResponse
  }

  private static prettify(data: any): string {
    return JSON.stringify(data, null, 2)
  }
}

export interface RequestAndResponse {
  request: RequestOrResponse;
  response: RequestOrResponse;
}

interface RequestOrResponse {
  headers: string;
  body: string;
}
