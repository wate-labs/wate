import Environment from './environment'

export default interface Context {
  requestsLocation: string;
  environment: Environment;
  params: Param[];
}

export interface Param {
  name: string;
  value: string;
}
