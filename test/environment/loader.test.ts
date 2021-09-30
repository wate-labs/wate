import {assert} from 'chai'
import * as path from 'path'
import EnvironmentLoader from '../../src/environment/loader'

const fixturePath = path.join(__dirname, '..', 'fixtures', 'environments')

describe('environment', () => {
  it('loads a complete custom environment', () => {
    const environment = EnvironmentLoader.load(fixturePath, 'full_env')
    assert.equal(environment.scheme, 'http')
    assert.equal(environment.host, 'my-host')
  })

  it('loads a environment with only the host set', () => {
    const environment = EnvironmentLoader.load(fixturePath, 'host_only_env')
    assert.equal(environment.scheme, 'https')
    assert.equal(environment.host, 'my-host')
  })

  it('raises an error if the environment is missing the required properties', () => {
    assert.throws(() => {
      EnvironmentLoader.load(fixturePath, 'empty_env')
    }, 'Malformed environment "empty_env": "/" must have required property \'host\'')
  })

  it('raises an error if the config cannot be found', () => {
    assert.throws(() => {
      EnvironmentLoader.load('idontexist', 'idontexist')
    }, 'Environment "idontexist" not found')
  })
})
