import {expect, test} from '@oclif/test'
import filesystem from '../../mockfs'
import * as fs from 'node:fs'

describe('create:suite', () => {
  test
  .do(() => {
    filesystem.mock({suites: null})
  })
  .finally(() => {
    filesystem.restore()
  })
  .stdout()
  .command(['create:suite', 'my_suite'])
  .it('creates a new suite config', ctx => {
    const expectedOutput = ['Created "my_suite" located at "suites"'].join(
      '\n',
    )
    expect(ctx.stdout).to.contain(expectedOutput)
    expect(fs.existsSync('suites/my_suite.json')).to.be.true
  })

  test
  .do(() => {
    filesystem.mock({suites: null})
  })
  .finally(() => {
    filesystem.restore()
  })
  .stdout()
  .command(['create:suite', 'collection/my_suite'])
  .it('creates a new suite config in a collection', ctx => {
    const expectedOutput = [
      'Created "collection/my_suite" located at "suites/collection"',
    ].join('\n')
    expect(ctx.stdout).to.contain(expectedOutput)
    expect(fs.existsSync('suites/collection/my_suite.json')).to.be.true
  })

  test
  .do(() => {
    filesystem.mock({suites: {'my_suite.json': {host: ''}}})
  })
  .finally(() => {
    filesystem.restore()
  })
  .stderr()
  .command(['create:suite', 'my_suite'])
  .catch(error => {
    expect(error.message).to.equal(
      'Suite "my_suite" (suites/my_suite.json) already exists.',
    )
  })
  .it('errors out when an suite already exists')

  test
  .do(() => {
    filesystem.mock({})
  })
  .finally(() => {
    filesystem.restore()
  })
  .stderr()
  .command(['create:suite', 'my_suite'])
  .catch(error => {
    expect(error.message).to.equal('Directory "suites" not found.')
  })
  .it('errors out when the suites directory is absent')
})
