import CaptureDefinition from './capture'
import Environment from './environment'
import Param from './param'

export default interface Context {
  requestsLocation: string;
  environment: Environment;
  params: Param[];
  captures: CaptureDefinition[];
}
