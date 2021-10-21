import Request from '../request'
import Response from '../response'

export default class ResponseHelper {
  public static emptyResponse(request: Request): Response {
    return {
      request,
      status: 0,
      durationInMs: 0,
      hasError: false,
      headers: null,
      data: null,
      error: {reason: ''},
    }
  }
}
