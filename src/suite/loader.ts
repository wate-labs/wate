import * as path from 'node:path'
import * as fs from 'node:fs'
import * as yaml from 'js-yaml'
import {Suite, Case, SuiteDefinition, RequestDefinition} from '../suite'
import Request from '../request'
import SchemaValidator, {ValidationSchema} from '../validator/schema'
import Context from '../context'
import RequestBuilder from '../request/builder'
import Param from '../param'
import DataHelper from '../data/helper'
import CaptureDefinition from '../capture'
import AssertionDefinition from '../assertion'
import {JSON_SCHEMA} from 'js-yaml'

export default class SuiteLoader {
  static schema: ValidationSchema = {
    type: 'object',
    properties: {
      name: {type: 'string'},
      description: {type: 'string'},
      cases: {
        type: 'array',
        items: {
          $ref: '#/definitions/case',
        },
        minItems: 1,
      },
    },
    required: ['name'],
    additionalProperties: false,
    definitions: {
      case: {
        type: 'object',
        properties: {
          name: {type: 'string'},
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

    return {
      name: suiteDefinition.name,
      cases: suiteDefinition.cases.map(({name, requests}) =>
        SuiteLoader.prepareCase(name, requests, context),
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

  private static prepareCase(
    name: string,
    requests: RequestDefinition[],
    context: Context,
  ): Case {
    return {
      name: name,
      requests: requests.map(({request, params, captures, assertions}) => {
        return SuiteLoader.prepareRequest(
          request,
          DataHelper.toParam(params),
          {
            captures: DataHelper.toCapture(captures),
            assertions: DataHelper.toAssertion(assertions),
          },
          context,
        )
      }),
    }
  }

  private static prepareRequest(
    request: string,
    params: Param[],
    definitions: {
      captures: CaptureDefinition[]
      assertions: AssertionDefinition[]
    },
    context: Context,
  ): Request {
    return RequestBuilder.prepare(
      path.join(context.requestsLocation, request),
      context,
      params,
      {
        captures: definitions.captures,
        assertions: definitions.assertions,
      },
    )
  }
}
