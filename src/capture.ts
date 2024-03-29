export default interface CaptureDefinition {
  name: string;
  expression: string;
}

export interface Capture {
  caseName?: string;
  order?: number;
  name: string;
  value: any;
}

export interface KeyValue {
  [key: string]: string;
}
