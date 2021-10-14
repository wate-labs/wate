export default interface Param {
  name: string;
  value: string | number | boolean | Array<any> | object;
}

export interface KeyValue {
  [key: string]: string | number | boolean | Array<any> | object;
}
