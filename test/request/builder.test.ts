import {assert} from 'chai'
import * as path from 'path'
import RequestBuilder from '../../src/request/builder'
import EnvironmentLoader from '../../src/environment/loader'

const fixturePath = path.join(__dirname, '..', 'fixtures', 'requests')
const environmentsPath = path.join(__dirname, '..', 'fixtures', 'environments')

describe('builder', () => {
  it('builds a request with environment', () => {
    const requestPath = path.join(fixturePath, 'request_1', 'request.http')
    const environment = EnvironmentLoader.load(environmentsPath, 'full_env')
    const request = RequestBuilder.build(requestPath, environment)
    assert.equal(request.url, '/get?query_param=value')
    assert.equal(request.baseURL, 'http://my-host')
    assert.equal(request.method, 'GET')
    assert.deepEqual(request.headers, {
      Host: 'my-host',
      'Content-Type': 'text/plain',
      'Content-Length': '27',
    })
  })
})
