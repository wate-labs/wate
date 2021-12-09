import * as path from 'path'
import * as fs from 'fs'
import {Suite, Case, SuiteDefinition, RequestDefinition} from '../suite'
import Request from '../request'
import SchemaValidator, {ValidationSchema} from '../validator/schema'
import Context from '../context'
import RequestBuilder from '../request/builder'
import Param from '../param'
import DataHelper from '../data/helper'
import CaptureDefinition from '../capture'
import AssertionDefinition from '../assertion'

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
        SuiteLoader.prepareCase(
          name,
          SuiteLoader.sanitized(name),
          requests,
          context,
        ),
      ),
    }
  }

  private static sanitized(value: string): string {
    value = value.replace(/^\s+|\s+$/g, '') // trim
    value = value.toLowerCase()

    // remove accents, swap ñ for n, etc
    const from = 'àáäâèéëêìíïîòóöôùúüûñç·/_,:;'
    const to = 'aaaaeeeeiiiioooouuuunc------'
    for (let i = 0, l = from.length; i < l; i++) {
      value = value.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i))
    }

    value = value
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-') // collapse dashes

    return value
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
    id: string,
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
            captures: DataHelper.toCapture(captures, id),
            assertions: DataHelper.toAssertion(assertions, id),
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
      captures: CaptureDefinition[];
      assertions: AssertionDefinition[];
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
