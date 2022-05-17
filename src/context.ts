import {AssertionBag} from './assertion'
import {Capture} from './capture'
import Environment from './environment'
import Param from './param'

export default interface Context {
  requestsLocation: string;
  environment: Environment;
  params: Param[];
  captures: Capture[];
  assertions: AssertionBag;
}
