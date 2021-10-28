import CaptureDefinition from './capture'

export default interface Request {
  url: string;
  baseURL: string;
  method: string;
  headers: any;
  data: any;
  captures: CaptureDefinition[];
}
