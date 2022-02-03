import Response from '../response'

export default class ResponseValidator {
  public static validate(response: Response) {
    if (response.hasError && response.status === -1 && response.error.reason === 'ENOTFOUND') {
      throw new Error('Could not find remote host')
    }
  }
}
