export default interface AssertionDefinition {
  name: string;
  expected: any;
}

export interface Assertion {
  name: string;
  expected: any;
  actual: any;
  matched: boolean;
}

export interface KeyValue {
  [key: string]: string;
}
