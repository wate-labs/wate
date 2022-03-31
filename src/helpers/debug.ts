export default class Debug {
  static inspect(val: any): string {
    return require('util').inspect(val, {depth: 10})
  }
}
