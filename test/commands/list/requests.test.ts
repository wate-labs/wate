import {expect, test} from '@oclif/test'
import fs from '../../mockfs'

describe('list:requests', () => {
  test
  .do(() => {
    fs.mock({requests: {request_1: {request: ''}, request_2: {request: ''}}})
  })
  .finally(() => {
    fs.restore()
  })
  .stdout()
  .command(['list:requests'])
  .it('lists only requests', ctx => {
    const expectedOutput = [
      'The following collections and requests were found.\n',
      'COLLECTIONS',
      '',
      '',
      'REQUESTS',
      '  request_1',
      '  request_2',
    ].join('\n')
    expect(ctx.stdout).to.contain(expectedOutput)
  })

  test
  .do(() => {
    fs.mock({
      requests: {
        collection: {request_1: {request: ''}, request_2: {request: ''}},
      },
    })
  })
  .finally(() => {
    fs.restore()
  })
  .stdout()
  .command(['list:requests'])
  .it('lists requests in a collection', ctx => {
    const expectedOutput = [
      'The following collections and requests were found.\n',
      'COLLECTIONS',
      '  collection',
      '',
      'REQUESTS',
      '  collection/request_1',
      '  collection/request_2',
    ].join('\n')
    expect(ctx.stdout).to.contain(expectedOutput)
  })

  test
  .do(() => {
    fs.mock({
      requests: {
        meta_collection: {
          nested_collection_1: {request_1: {request: ''}},
          nested_collection_2: {request_2: {request: ''}},
        },
      },
    })
  })
  .finally(() => {
    fs.restore()
  })
  .stdout()
  .command(['list:requests'])
  .it('lists requests in nested collections', ctx => {
    const expectedOutput = [
      'The following collections and requests were found.\n',
      'COLLECTIONS',
      '  meta_collection',
      '    nested_collection_1',
      '    nested_collection_2',
      '',
      'REQUESTS',
      '  meta_collection/nested_collection_1/request_1',
      '  meta_collection/nested_collection_2/request_2',
    ].join('\n')
    expect(ctx.stdout).to.contain(expectedOutput)
  })

  test
  .do(() => {
    fs.mock({})
  })
  .finally(() => {
    fs.restore()
  })
  .stderr()
  .command(['list:requests'])
  .catch(error => {
    expect(error.message).to.equal('Could not find requests directory')
  })
  .it('notes that the requests directory is absent')

  test
  .do(() => {
    fs.mock({requests: null})
  })
  .finally(() => {
    fs.restore()
  })
  .stderr()
  .command(['list:requests'])
  .catch(error => {
    expect(error.message).to.equal('No collections or requests found')
  })
  .it('notes when no collections or requests could be found')
})
