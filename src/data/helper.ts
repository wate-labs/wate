import Param, {KeyValue as ParamKeyValue} from '../param'
import CaptureDefinition, {KeyValue as CaptureKeyValue} from '../capture'
import AssertionDefinition, {KeyValue as AssertionKeyValue} from '../assertion'

export default class DataHelper {
  public static toKV(params: Param[]): ParamKeyValue {
    /* eslint-disable unicorn/prefer-object-from-entries */
    return params.reduce((params, {name, value}) => {
      return {...params, [name]: DataHelper.parse(value)}
    }, {})
  }

  public static mergeKV(
    kvLeft: ParamKeyValue,
    kvRight: ParamKeyValue,
  ): ParamKeyValue {
    for (const [name, value] of Object.entries(kvRight || [])) {
      kvLeft[name] = value
    }

    return kvLeft
  }

  public static toParam(params: ParamKeyValue): Param[] {
    return Object.entries(params || []).map(([name, value]): Param => {
      return {name, value}
    })
  }

  public static toCapture(captures: CaptureKeyValue): CaptureDefinition[] {
    return Object.entries(captures || []).map(
      ([name, expression]): CaptureDefinition => {
        return {name, expression}
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
