import Param, {KeyValue as ParamKeyValue} from '../param'
import Capture, {KeyValue as CaptureKeyValue} from '../capture'

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

  public static toCapture(captures: CaptureKeyValue): Capture[] {
    return Object.entries(captures || []).map(([name, jsonPath]): Capture => {
      return {name, jsonPath}
    })
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
