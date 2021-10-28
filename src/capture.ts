export default interface CaptureDefinition {
  name: string;
  jsonPath: string;
}

export interface Capture {
  name: string;
  value: any;
}

export interface KeyValue {
  [key: string]: string;
}
