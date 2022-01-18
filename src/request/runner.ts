import axios, {AxiosRequestConfig, AxiosResponse} from 'axios'
import * as jsonata from 'jsonata'
import Request from '../request'
import Response from '../response'
import CaptureDefinition, {Capture} from '../capture'

export default class RequestRunner {
  public static async run(request: Request): Promise<Response> {
    let headers = null
    let data: any = null
    let durationInMs = 0
    let status = -1
    let hasError = false
    let errorObject = {
      reason: '',
    }
    let captures: Capture[] = []
    axios.interceptors.request.use(
      function (config) {
        (config as MetadataAwareAxiosRequestConfig).metadata = {
          startTime: Date.now(),
        }
        return config
      },
      function (error) {
        return Promise.reject(error)
      },
    )
    axios.interceptors.response.use(
      function (response) {
        (response as MetadataAwareAxiosResponse).durationInMs =
          Date.now() -
          (response as MetadataAwareAxiosResponse).config.metadata.startTime
        return response
      },
      function (error) {
        error.config.metadata.endTime = new Date()
        error.durationInMs =
          error.config.metadata.endTime - error.config.metadata.startTime
        return Promise.reject(error)
      },
    )
    try {
      ({headers, data, status, durationInMs} = await axios.request(
        RequestRunner.prepare(request),
      ))
      captures = RequestRunner.captureFromBody(data, request.captures)
    } catch (error) {
      hasError = true
      if (error.response?.status) {
        headers = error.response.headers
        data = error.response.data
        errorObject = {
          reason: `Status code: ${error.response.status} (${error.response.statusText})`,
        }
      } else if (error.code) {
        errorObject = {
          reason: error.code,
        }
      } else if (error.message) {
        errorObject = {
          reason: error.message,
        }
      } else {
        errorObject = {
          reason: 'An unknown error occurred in RequestRunner',
        }
      }
    }

    return {
      request,
      status,
      headers,
      data,
      hasError,
      error: errorObject,
      durationInMs,
      captures,
    }
  }

  private static prepare(request: Request): AxiosRequestConfig {
    return request as AxiosRequestConfig
  }

  private static captureFromBody(
    data: any,
    captures: CaptureDefinition[],
  ): Capture[] {
    if (typeof data === 'object') {
      return captures.reduce(
        (acc, capture) => [...acc, RequestRunner.captureValue(capture, data)],
        [] as Capture[],
      )
    }

    throw new Error('Passed `data` is not an object')
  }

  private static captureValue(capture: CaptureDefinition, data: any): Capture {
    const value = jsonata(capture.expression).evaluate(data)

    return {name: capture.name, value: RequestRunner.cleanCapture(value)}
  }

  private static cleanCapture(raw: any): any {
    return JSON.parse(JSON.stringify(raw))
  }
}

interface MetadataAwareAxiosRequestConfig extends AxiosRequestConfig {
  metadata: {
    startTime: number;
  };
}

interface MetadataAwareAxiosResponse extends AxiosResponse {
  config: MetadataAwareAxiosRequestConfig;
  durationInMs: number;
}
