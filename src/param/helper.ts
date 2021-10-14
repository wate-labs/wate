import Param, {KeyValue} from '../param'

export default class ParamHelper {
  public static toKV(params: Param[]): KeyValue {
    return params.reduce((params, {name, value}) => {
      return {...params, [name]: value}
    }, {})
  }

  public static toParam(params: KeyValue): Param[] {
    return Object.entries(params || []).map(([name, value]): Param => {
      return {name, value}
    })
  }
}
