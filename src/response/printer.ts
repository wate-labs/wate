import Response from '../response'
import ResponseValidator from '../response/validator'

export default class ResponsePrinter {
  public static print(response: Response): PrettyResponse {
    ResponseValidator.validate(response)

    return {
      headers: JSON.stringify(response.headers, null, 2),
      body: JSON.stringify(response.data, null, 2),
    } as PrettyResponse
  }
}

export interface PrettyResponse {
  headers: string;
  body: string;
}
