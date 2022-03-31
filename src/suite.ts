import {KeyValue as ParamKeyValue} from './param'
import {KeyValue as CaptureKeyValue} from './capture'
import {KeyValue as AssertionKeyValue} from './assertion'
import Request from './request'

export interface SuiteDefinition {
  name: string
  matrix?: Matrix[]
  cases: CaseDefinition[]
}

interface Matrix {
  name: string
  caseName: string
  params: ParamKeyValue
  captures: CaptureKeyValue
  assertions: AssertionKeyValue
}

export interface KeyValueBag {
  params: ParamKeyValue
  captures: CaptureKeyValue
  assertions: AssertionKeyValue
}

export interface CaseDefinition {
  name: string
  matrix?: boolean
  requests: RequestDefinition[]
}

export interface Suite {
  name: string
  cases: Case[]
}

export interface Case {
  name: string
  requests: Request[]
}

export interface RequestDefinition {
  request: string
  delayed: number
  params: ParamKeyValue
  captures: CaptureKeyValue
  assertions: AssertionKeyValue
}
