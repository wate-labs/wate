import {assert} from 'chai'
import * as path from 'path'
import EnvironmentLoader from '../src/environment'

const fixturePath = path.join(__dirname, 'fixtures', 'environments')

describe('environment', () => {
  it('loads a complete custom environment', () => {
    const environmentPath = path.join(fixturePath, 'full_env.json')
    const environment = EnvironmentLoader.load(environmentPath)
    assert.equal(environment.scheme, 'http')
    assert.equal(environment.host, 'my-host')
  })

  it('loads a environment with only the host set', () => {
    const environmentPath = path.join(fixturePath, 'host_only_env.json')
    const environment = EnvironmentLoader.load(environmentPath)
    assert.equal(environment.scheme, 'https')
    assert.equal(environment.host, 'my-host')
  })

  it('loads an empty environment', () => {
    const environmentPath = path.join(fixturePath, 'empty_env.json')
    const environment = EnvironmentLoader.load(environmentPath)
    assert.equal(environment.scheme, 'https')
    assert.equal(environment.host, null)
  })

  it('raises an error if the config cannot be found', () => {
    const environmentPath = 'idontexist'
    assert.throws(() => {
      EnvironmentLoader.load(environmentPath)
    }, 'File idontexist not found')
  })
})
