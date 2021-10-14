import Param, {KeyValue} from '../param'

export default class ParamHelper {
  public static toKV(params: Param[]): KeyValue {
    return params.reduce((params, {name, value}) => {
      return {...params, [name]: ParamHelper.parse(value)}
    }, {})
  }

  public static toParam(params: KeyValue): Param[] {
    return Object.entries(params || []).map(([name, value]): Param => {
      return {name, value}
    })
  }

  private static parse(value: any): string | boolean | number {
    if (ParamHelper.isObject(value)) {
      return JSON.stringify(value)
    }

    return value
  }

  private static isObject(value: Array<any> | object) {
    // eslint-disable-next-line no-new-object
    return value === new Object(value)
  }
}
