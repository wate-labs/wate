import {expect, test} from '@oclif/test'
import filesystem from '../../mockfs'
import * as fs from 'fs'

describe('create:request', () => {
  test
  .do(() => {
    filesystem.mock({requests: null})
  })
  .finally(() => {
    filesystem.restore()
  })
  .stdout()
  .command(['create:request', 'my_request'])
  .it('creates a new request scaffold', ctx => {
    const expectedOutput = [
      'Created "my_request" located under requests/my_request',
    ].join('\n')
    expect(ctx.stdout).to.contain(expectedOutput)
    expect(fs.existsSync('requests/my_request')).to.be.true
    expect(fs.existsSync('requests/my_request/pre-request.js')).to.be.true
    expect(fs.existsSync('requests/my_request/request.http')).to.be.true
  })

  test
  .do(() => {
    filesystem.mock({requests: null})
  })
  .finally(() => {
    filesystem.restore()
  })
  .stdout()
  .command(['create:request', 'collection/my_request'])
  .it('creates a new request scaffold in a collection', ctx => {
    const expectedOutput = [
      'Created "collection/my_request" located under requests/collection/my_request',
    ].join('\n')
    expect(ctx.stdout).to.contain(expectedOutput)
    expect(fs.existsSync('requests/collection/my_request')).to.be.true
    expect(fs.existsSync('requests/collection/my_request/pre-request.js')).to
    .be.true
    expect(fs.existsSync('requests/collection/my_request/request.http')).to.be
    .true
  })

  test
  .do(() => {
    filesystem.mock({requests: {my_request: {request: ''}}})
  })
  .finally(() => {
    filesystem.restore()
  })
  .stderr()
  .command(['create:request', 'my_request'])
  .catch(error => {
    expect(error.message).to.equal(
      'Request "my_request" (requests/my_request) already exists.',
    )
  })
  .it('errors out when a request already exists')

  test
  .do(() => {
    filesystem.mock({})
  })
  .finally(() => {
    filesystem.restore()
  })
  .stderr()
  .command(['create:request', 'my_request'])
  .catch(error => {
    expect(error.message).to.equal('Directory "requests" not found.')
  })
  .it('errors out when the requests directory is absent')
})
