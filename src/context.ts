import Environment from './environment'

export default interface Context {
  requestsFolder: string;
  environment: Environment;
  params: Param[];
}

export interface Param {
  name: string;
  value: string;
}
