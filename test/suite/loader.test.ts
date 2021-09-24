import {assert} from 'chai'
import * as path from 'path'
import SuiteLoader from '../../src/suite/loader'
import EnvironmentLoader from '../../src/environment/loader'

const fixturePath = path.join(__dirname, '..', 'fixtures', 'suites')
const environmentsPath = path.join(__dirname, '..', 'fixtures', 'environments')

describe('suite loader', () => {
  it('loads a suite', () => {
    const suitePath = fixturePath
    const environment = EnvironmentLoader.load(environmentsPath, 'full_env')
    const suite = SuiteLoader.load(suitePath, 'suite_1', environment)
  })
})
