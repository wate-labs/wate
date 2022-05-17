import {assert} from 'chai'
import * as path from 'node:path'
import RequestBuilder from '../../src/request/builder'
import EnvironmentLoader from '../../src/environment/loader'
import Environment from '../../src/environment'
import Context from '../../src/context'

const fixturePath = path.join(__dirname, '..', 'fixtures', 'requests')
const environmentsPath = path.join(__dirname, '..', 'fixtures', 'environments')

const buildContext = (environment: Environment): Context => {
  return {
    environment,
    requestsLocation: '',
    params: [],
    captures: [],
    assertions: {},
  }
}

describe('builder', () => {
  it('builds a request with environment', () => {
    const requestPath = path.join(fixturePath, 'request_1')
    const environment = EnvironmentLoader.load(environmentsPath, 'full_env')
    const context = buildContext(environment)
    const preparedRequest = RequestBuilder.prepare(
      requestPath,
      0,
      context,
      [],
      {
        captures: [],
        assertions: [],
      },
    )
    const request = RequestBuilder.render('n/a', preparedRequest, context)
    assert.equal(request.url, '/get?query_param=value')
    assert.equal(request.baseURL, 'http://my-host')
    assert.equal(request.method, 'GET')
    assert.deepEqual(request.headers, {
      Host: 'my-host',
      'Content-Type': 'text/plain',
      'Content-Length': '27',
    })
  })
  it('sets variables to a request body', () => {
    const requestPath = path.join(fixturePath, 'request_with_placeholders')
    const environment = EnvironmentLoader.load(environmentsPath, 'full_env')
    const context = buildContext(environment)
    const preparedRequest = RequestBuilder.prepare(
      requestPath,
      0,
      context,
      [
        {
          name: 'placeholder',
          value: 'testValue',
        },
      ],
      {
        captures: [],
        assertions: [],
      },
    )
    const request = RequestBuilder.render('n/a', preparedRequest, context)
    assert.equal(request.data.propertyWithPlaceholder, 'testValue')
  })
  it('sets variables to a request header', () => {
    const requestPath = path.join(
      fixturePath,
      'request_with_header_placeholder',
    )
    const environment = EnvironmentLoader.load(environmentsPath, 'full_env')
    const context = buildContext(environment)
    const preparedRequest = RequestBuilder.prepare(
      requestPath,
      0,
      context,
      [
        {
          name: 'placeholder',
          value: 'testValue',
        },
      ],
      {
        captures: [],
        assertions: [],
      },
    )
    const request = RequestBuilder.render('n/a', preparedRequest, context)
    assert.equal(request.headers['X-Custom'], 'testValue')
  })
  it('raises if a variable is missing', () => {
    const requestPath = path.join(fixturePath, 'request_with_placeholders')
    const environment = EnvironmentLoader.load(environmentsPath, 'full_env')
    const context = buildContext(environment)
    const preparedRequest = RequestBuilder.prepare(
      requestPath,
      0,
      context,
      [],
      {
        captures: [],
        assertions: [],
      },
    )
    assert.throws(
      () => RequestBuilder.render('n/a', preparedRequest, context),
      'The following variables are missing: placeholder',
    )
  })
})
