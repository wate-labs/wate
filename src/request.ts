import AssertionDefinition from './assertion'
import CaptureDefinition from './capture'
import Param from './param'

export default interface Request {
  name: string
  delayed: number
  retries: number
  allowError: boolean
  path: string
  url: string
  baseURL: string
  method: string
  headers: any
  data: any
  params: Param[]
  captures: CaptureDefinition[]
  assertions: AssertionDefinition[]
  order?: number
}
