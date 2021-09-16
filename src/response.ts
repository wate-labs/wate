import Request from './request'
import Error from './error'

export default interface Response {
  request: Request;
  status: number;
  headers: any;
  data: any;
  hasError: boolean;
  error: Error;
  durationInMs: number;
}
