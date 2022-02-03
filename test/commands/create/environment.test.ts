import {expect, test} from '@oclif/test'
import filesystem from '../../mockfs'
import * as fs from 'node:fs'

describe('create:environment', () => {
  test
  .do(() => {
    filesystem.mock({environments: null})
  })
  .finally(() => {
    filesystem.restore()
  })
  .stdout()
  .command(['create:environment', 'my_env'])
  .it('creates a new environment config', ctx => {
    const expectedOutput = [
      'Created "my_env" located at "environments"',
    ].join('\n')
    expect(ctx.stdout).to.contain(expectedOutput)
    expect(fs.existsSync('environments/my_env.json')).to.be.true
  })

  test
  .do(() => {
    filesystem.mock({environments: null})
  })
  .finally(() => {
    filesystem.restore()
  })
  .stdout()
  .command(['create:environment', 'collection/my_env'])
  .it('creates a new environment config in a collection', ctx => {
    const expectedOutput = [
      'Created "collection/my_env" located at "environments/collection"',
    ].join('\n')
    expect(ctx.stdout).to.contain(expectedOutput)
    expect(fs.existsSync('environments/collection/my_env.json')).to.be.true
  })

  test
  .do(() => {
    filesystem.mock({environments: {'my_env.json': {host: ''}}})
  })
  .finally(() => {
    filesystem.restore()
  })
  .stderr()
  .command(['create:environment', 'my_env'])
  .catch(error => {
    expect(error.message).to.equal(
      'Environment "my_env" (environments/my_env.json) already exists.',
    )
  })
  .it('errors out when an environment already exists')

  test
  .do(() => {
    filesystem.mock({})
  })
  .finally(() => {
    filesystem.restore()
  })
  .stderr()
  .command(['create:environment', 'my_env'])
  .catch(error => {
    expect(error.message).to.equal('Directory "environments" not found.')
  })
  .it('errors out when the environments directory is absent')
})
