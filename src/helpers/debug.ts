export const Debug = {
  inspect: (val: any): string => {
    return require('util').inspect(val, {depth: 10})
  },
}
