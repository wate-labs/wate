import {assert} from 'chai'
import * as path from 'path'
import EnvironmentLoader from '../../src/environment'
import RequestBuilder from '../../src/request/builder'

const fixturePath = path.join(__dirname, '..', 'fixtures', 'requests')
const environmentsPath = path.join(__dirname, '..', 'fixtures', 'environments')

describe('builder', () => {
  it('builds a request without environment', () => {
    const requestPath = path.join(fixturePath, 'request_1', 'request.http')
    const environment = EnvironmentLoader.load(
      path.join(environmentsPath, 'empty_env.json')
    )
    const request = RequestBuilder.build(requestPath, environment)
    assert.equal(request.url, '/get?query_param=value')
    assert.equal(request.baseURL, 'https://my-request.host')
    assert.equal(request.method, 'GET')
    assert.deepEqual(request.headers, {
      Host: 'my-request.host',
      'Content-Type': 'text/plain',
      'Content-Length': '27',
    })
  })

  it('builds a request with environment', () => {
    const requestPath = path.join(fixturePath, 'request_1', 'request.http')
    const environment = EnvironmentLoader.load(
      path.join(environmentsPath, 'full_env.json')
    )
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
