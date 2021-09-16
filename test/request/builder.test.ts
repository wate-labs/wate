import {assert} from 'chai'
import * as path from 'path'
import RequestBuilder from '../../src/request/builder'
import EnvironmentLoader from '../../src/environment/loader'

const fixturePath = path.join(__dirname, '..', 'fixtures', 'requests')
const environmentsPath = path.join(__dirname, '..', 'fixtures', 'environments')

describe('builder', () => {
  it('builds a request with environment', () => {
    const requestPath = path.join(fixturePath, 'request_1')
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
  it('sets parameters to a request body', () => {
    const requestPath = path.join(fixturePath, 'request_with_placeholders')
    const environment = EnvironmentLoader.load(environmentsPath, 'full_env')
    const request = RequestBuilder.build(requestPath, environment, {
      placeholder: 'testValue',
    })
    assert.equal(request.data.propertyWithPlaceholder, 'testValue')
  })
  it('sets parameters to a request header', () => {
    const requestPath = path.join(
      fixturePath,
      'request_with_header_placeholder',
    )
    const environment = EnvironmentLoader.load(environmentsPath, 'full_env')
    const request = RequestBuilder.build(requestPath, environment, {
      placeholder: 'testValue',
    })
    assert.equal(request.headers['X-Custom'], 'testValue')
  })
})
