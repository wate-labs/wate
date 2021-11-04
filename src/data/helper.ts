import Param, {KeyValue as ParamKeyValue} from '../param'
import CaptureDefinition, {KeyValue as CaptureKeyValue} from '../capture'
import AssertionDefinition, {KeyValue as AssertionKeyValue} from '../assertion'

export default class DataHelper {
  public static toKV(params: Param[]): ParamKeyValue {
    return params.reduce((params, {name, value}) => {
      return {...params, [name]: DataHelper.parse(value)}
    }, {})
  }

  public static toParam(params: ParamKeyValue): Param[] {
    return Object.entries(params || []).map(([name, value]): Param => {
      return {name, value}
    })
  }

  public static toCapture(captures: CaptureKeyValue): CaptureDefinition[] {
    return Object.entries(captures || []).map(
      ([name, jsonPath]): CaptureDefinition => {
        return {name, jsonPath}
      },
    )
  }

  public static toAssertion(
    assertions: AssertionKeyValue,
  ): AssertionDefinition[] {
    return Object.entries(assertions || []).map(
      ([name, captureName]): AssertionDefinition => {
        return {name, expected: captureName}
      },
    )
  }

  private static parse(value: any): string | boolean | number {
    if (DataHelper.isObject(value)) {
      return JSON.stringify(value)
    }

    return value
  }

  private static isObject(value: Array<any> | object) {
    // eslint-disable-next-line no-new-object
    return value === new Object(value)
  }
}
