import AssertionDefinition from './assertion'
import CaptureDefinition from './capture'
import Param from './param'

export default interface Request {
  delayed: number
  retries: number
  path: string
  url: string
  baseURL: string
  method: string
  headers: any
  data: any
  params: Param[]
  captures: CaptureDefinition[]
  assertions: AssertionDefinition[]
}
