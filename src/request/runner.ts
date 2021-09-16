import Request from '../request'
import Response from '../response'
import axios, {AxiosRequestConfig, AxiosResponse} from 'axios'

export default class Runner {
  public static async run(request: Request): Promise<Response> {
    let headers = null
    let data = null
    let durationInMs = 0
    let status = -1
    let hasError = false
    let errorObject = {
      reason: '',
    }
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
        Runner.prepare(request),
      ))
    } catch (error) {
      hasError = true
      if (error.response?.status) {
        headers = error.response.headers
        data = error.response.data
        errorObject = {
          reason: `Status code: ${error.response.status} (${error.response.statusText})`,
        }
      } else {
        errorObject = {
          reason: error.code,
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
    }
  }

  private static prepare(request: Request): AxiosRequestConfig {
    return request as AxiosRequestConfig
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
