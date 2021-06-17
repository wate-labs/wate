import Request from './request'
import Response from './response'
import axios, {AxiosRequestConfig} from 'axios'

export default class Runner {
  public static async run(request: Request): Promise<Response> {
    let headers = null
    let data = null
    let status = -1
    let hasError = false
    let errorObject = {
      reason: '',
    }
    try {
      ({headers, data, status} = await axios.request(Runner.prepare(request)))
    } catch (error) {
      hasError = true
      errorObject = {
        reason: error.code,
      }
    }
    return {
      request,
      status,
      headers,
      data,
      hasError,
      error: errorObject,
    }
  }

  private static prepare(request: Request): AxiosRequestConfig {
    return request as AxiosRequestConfig
  }
}
