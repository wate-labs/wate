import * as path from 'path'
import SuiteLoader from '../../src/suite/loader'
import EnvironmentLoader from '../../src/environment/loader'
import Context from '../../src/context'
import {assert} from 'chai'

const fixturePath = path.join(__dirname, '..', 'fixtures', 'suites')
const environmentsPath = path.join(__dirname, '..', 'fixtures', 'environments')
const requestsPath = path.join(__dirname, '..', 'fixtures', 'requests')

describe('suite loader', () => {
  it('loads a suite', () => {
    const suitePath = fixturePath
    const environment = EnvironmentLoader.load(environmentsPath, 'full_env')
    const context = {
      requestsLocation: requestsPath,
      environment: environment,
      params: [],
      captures: [],
    } as Context
    const suite = SuiteLoader.load(suitePath, 'suite_1', context)
    assert.equal(suite.name, 'My suite name')
    assert.lengthOf(suite.cases, 1)
    const suiteCase = suite.cases.pop()
    assert.equal(suiteCase!.name, 'My test case')
    assert.lengthOf(suiteCase!.requests, 1)
  })
})
