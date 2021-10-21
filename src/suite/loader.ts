import * as path from 'path'
import * as fs from 'fs'
import {Suite, Case, SuiteDefinition, RequestDefinition} from '../suite'
import Request from '../request'
import SchemaValidator, {ValidationSchema} from '../validator/schema'
import Context from '../context'
import RequestBuilder from '../request/builder'
import Param from '../param'
import DataHelper from '../data/helper'
import Capture from '../capture'

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
        },
        required: ['request'],
        additionalProperties: false,
      },
    },
  }

  public static load(suitePath: string, name: string, context: Context): Suite {
    const filePath = path.join(suitePath, `${name}.json`)
    if (!fs.existsSync(filePath)) {
      throw new Error(`Suite "${name}" not found`)
    }
    const suiteDefinition: SuiteDefinition = JSON.parse(
      fs.readFileSync(filePath).toString(),
    )

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
      requests: requests.map(({request, params, captures}) =>
        SuiteLoader.buildRequest(
          request,
          DataHelper.toParam(params),
          DataHelper.toCapture(captures),
          context,
        ),
      ),
    }
  }

  private static buildRequest(
    request: string,
    params: Param[],
    captures: Capture[],
    context: Context,
  ): Request {
    return RequestBuilder.build(
      path.join(context.requestsLocation, request),
      context.environment,
      [...params, ...context.params],
      captures,
    )
  }
}
