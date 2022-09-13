export default interface CaptureDefinition {
  name: string;
  expression: string;
}

export interface Capture {
  caseName?: string;
  _id?: number;
  name: string;
  value: any;
}

export interface KeyValue {
  [key: string]: string;
}
