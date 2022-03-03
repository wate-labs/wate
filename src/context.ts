import {Assertion} from './assertion'
import {Capture} from './capture'
import Environment from './environment'
import {Import} from './import'
import Param from './param'

export default interface Context {
  requestsLocation: string
  environment: Environment
  params: Param[]
  captures: Capture[]
  assertions: Assertion[]
  imports: Import[]
}
