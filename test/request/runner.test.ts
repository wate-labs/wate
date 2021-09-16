import Request from '../../src/request'
import Runner from '../../src/request/runner'
import {assert} from 'chai'

const requestFixture = (config?: object): Request => {
  return {
    url: '/get',
    baseURL: 'https://postman-echo.com',
    method: 'GET',
    headers: {},
    data: {},
    ...config,
  } as Request
}

describe('runner', () => {
  it('runs a request', async () => {
    const response = await Runner.run(requestFixture())

    assert.equal(response.status, 200)
    assert.equal(
      response.headers['content-type'],
      'application/json; charset=utf-8',
    )
    assert.isObject(response.data)
    assert.isNotEmpty(response.data)
  })

  it('exits if host not found', async () => {
    const response = await Runner.run(
      requestFixture({baseURL: 'https://notfound'}),
    )
    assert.isTrue(response.hasError)
    assert.equal(response.error.reason, 'ENOTFOUND')
  })
})
