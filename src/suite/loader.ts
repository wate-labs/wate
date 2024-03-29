import * as path from 'node:path'
import * as fs from 'node:fs'
import * as yaml from 'js-yaml'
import {JSON_SCHEMA} from 'js-yaml'
import {cloneDeep} from 'lodash'
import {Suite, Case, SuiteDefinition, RequestDefinition, CaseDefinition, KeyValueBag} from '../suite'
import Request from '../request'
import SchemaValidator, {ValidationSchema} from '../validator/schema'
import Context from '../context'
import RequestBuilder from '../request/builder'
import DataHelper from '../data/helper'
import Param, {KeyValue as ParamKeyValue} from '../param'
import CaptureDefinition, {KeyValue as CaptureKeyValue} from '../capture'
import AssertionDefinition, {KeyValue as AssertionKeyValue} from '../assertion'

export default class SuiteLoader {
  static schema: ValidationSchema = {
    type: 'object',
    properties: {
      name: {type: 'string'},
      description: {type: 'string'},
      matrix: {
        type: 'array',
        items: {
          $ref: '#/definitions/matrix',
        },
        minItems: 0,
      },
      cases: {
        type: 'array',
        items: {
          $ref: '#/definitions/case',
        },
        minItems: 1,
      },
    },
    required: ['name', 'cases'],
    additionalProperties: false,
    definitions: {
      matrix: {
        type: 'object',
        properties: {
          name: {type: 'string'},
          delayed: {type: 'number'},
          caseName: {type: 'string'},
          description: {type: 'string'},
          params: {
            type: 'object',
            additionalProperties: true,
          },
          captures: {
            type: 'object',
            additionalProperties: true,
          },
          assertions: {
            type: 'object',
            additionalProperties: true,
          },
        },
        required: ['name', 'caseName'],
        additionalProperties: false,
      },
      case: {
        type: 'object',
        properties: {
          name: {type: 'string'},
          matrix: {type: 'boolean'},
          description: {type: 'string'},
          requests: {
            type: 'array',
            items: {
              $ref: '#/definitions/request',
            },
            minItems: 1,
          },
        },
        required: ['name', 'requests'],
        additionalProperties: false,
      },
      request: {
        type: 'object',
        properties: {
          request: {type: 'string'},
          delayed: {type: 'number'},
          retries: {type: 'number'},
          allowError: {type: 'boolean'},
          params: {
            type: 'object',
            additionalProperties: true,
          },
          captures: {
            type: 'object',
            additionalProperties: true,
          },
          assertions: {
            type: 'object',
            additionalProperties: true,
          },
        },
        required: ['request'],
        additionalProperties: false,
      },
    },
  }

  public static load(suitePath: string, name: string, context: Context): Suite {
    const filePathJson = path.join(suitePath, `${name}.json`)
    const filePathYaml = path.join(suitePath, `${name}.yaml`)
    let suiteDefinition: SuiteDefinition
    if (fs.existsSync(filePathJson)) {
      suiteDefinition = JSON.parse(fs.readFileSync(filePathJson).toString())
    } else if (fs.existsSync(filePathYaml)) {
      suiteDefinition = yaml.load(fs.readFileSync(filePathYaml).toString(), {
        schema: JSON_SCHEMA,
      }) as SuiteDefinition
    } else {
      throw new Error(`Suite "${name}" not found`)
    }

    SuiteLoader.validateSuite(suiteDefinition)

    let cases = suiteDefinition.cases

    if (suiteDefinition.matrix) {
      const matrixTestCases = cases.filter(({matrix}) => matrix === true)
      cases = cases.filter(({matrix}) => matrix !== true)
      suiteDefinition.matrix.forEach(({name, caseName, delayed, params, captures, assertions}) => {
        const caseDefinition = cloneDeep(matrixTestCases.filter(caseDefinition => caseDefinition.name === caseName).pop())
        if (!caseDefinition) {
          throw new Error(`No test case found with name "${caseName}" or it is not annotated as matrix test case`)
        }

        cases.push(SuiteLoader.prepareMatrixCase(caseDefinition, name, delayed, {params, captures, assertions}))
      })
    }

    return {
      name: suiteDefinition.name,
      cases: cases.map(({name, delayed, requests}) =>
        SuiteLoader.prepareCase(name, delayed, requests, context),
      ),
    }
  }

  private static validateSuite(suiteDefinition: SuiteDefinition) {
    const validation = SchemaValidator.validate(
      SuiteLoader.schema,
      suiteDefinition,
    )
    if (!validation.isValid) {
      throw new Error(
        `"${validation.error?.path}" ${validation.error?.message}`,
      )
    }
  }

  private static prepareMatrixCase({requests}: CaseDefinition, caseName: string, delayed: number | undefined, kvBag: KeyValueBag): CaseDefinition {
    return {name: caseName, delayed, requests: requests.map(({request, delayed, retries, allowError, params, captures, assertions}) => {
      params = SuiteLoader.setMatrixValues(params, kvBag.params)
      captures = SuiteLoader.setMatrixValues(captures, kvBag.captures) as CaptureKeyValue
      assertions = SuiteLoader.setMatrixValues(assertions, kvBag.assertions) as AssertionKeyValue

      return {
        request,
        delayed,
        retries,
        allowError,
        params,
        captures,
        assertions,
      }
    })}
  }

  private static setMatrixValues(caseData: ParamKeyValue|CaptureKeyValue|AssertionKeyValue, matrixData: ParamKeyValue|CaptureKeyValue|AssertionKeyValue): ParamKeyValue|CaptureKeyValue|AssertionKeyValue {
    Object.entries(caseData || []).forEach(([name, value]) => {
      if (name === '_') {
        caseData = matrixData
      } else if (typeof value === 'string' && value.startsWith('$matrix')) {
        caseData[name] = matrixData[name]
      }
    })

    return caseData
  }

  private static prepareCase(
    name: string,
    delayed: number | undefined,
    requests: RequestDefinition[],
    context: Context,
  ): Case {
    return {
      name,
      delayed,
      requests: requests.map(
        ({request, delayed, retries, allowError, params, captures, assertions}) => {
          return SuiteLoader.prepareRequest(
            request,
            delayed,
            retries,
            allowError,
            DataHelper.toParam(params),
            {
              captures: DataHelper.toCapture(captures),
              assertions: DataHelper.toAssertion(assertions),
            },
            context,
          )
        },
      ),
    }
  }

  private static prepareRequest(
    request: string,
    delayed: number,
    retries: number,
    allowError: boolean,
    params: Param[],
    definitions: {
      captures: CaptureDefinition[]
      assertions: AssertionDefinition[]
    },
    context: Context,
  ): Request {
    return RequestBuilder.prepare(
      request,
      path.join(context.requestsLocation, request),
      delayed,
      retries,
      allowError,
      context,
      params,
      {
        captures: definitions.captures,
        assertions: definitions.assertions,
      },
    )
  }
}
