export default interface CaptureDefinition {
  name: string;
  expression: string;
}

export interface Capture {
  name: string;
  value: any;
}

export interface KeyValue {
  [key: string]: string;
}
