import {expect, test} from '@oclif/test'
import fs from '../../mockfs'

describe('run:request', () => {
  test
  .do(() => {
    fs.mock({suites: {suite_1: '', suite_2: ''}})
  })
  .finally(() => {
    fs.restore()
  })
  .stdout()
  .command(['run:request'])
  .it('runs an existing request', ctx => {
    const expectedOutput = [
      'The following collections and suites were found.\n',
      'COLLECTIONS',
      '',
      '',
      'SUITES',
      '  suite_1',
      '  suite_2',
    ].join('\n')
    expect(ctx.stdout).to.contain(expectedOutput)
  })
})
