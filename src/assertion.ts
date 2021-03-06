export default interface AssertionDefinition {
  name: string;
  expected: any;
}

export interface AssertionBag {
  [caseName: string]: Assertion[];
}

export interface Assertion {
  caseName: string;
  name: string;
  expected: any;
  actual: any;
  matched: boolean;
}

export interface KeyValue {
  [key: string]: string;
}
