import {expect, test} from '@oclif/test'
import fs from '../../mockfs'

describe('list:suites', () => {
  test
  .do(() => {
    fs.mock({suites: {suite_1: '', suite_2: ''}})
  })
  .finally(() => {
    fs.restore()
  })
  .stdout()
  .command(['list:suites'])
  .it('lists only suites', ctx => {
    const expectedOutput = [
      'The following collections and suites were found.\n',
      'COLLECTIONS',
      '',
      '',
      'SUITES',
      '  suite_1',
      '  suite_2',
    ].join('\n')
    expect(ctx.stdout).to.contain(expectedOutput)
  })

  test
  .do(() => {
    fs.mock({
      suites: {
        collection: {suite_1: '', suite_2: ''},
      },
    })
  })
  .finally(() => {
    fs.restore()
  })
  .stdout()
  .command(['list:suites'])
  .it('lists suites in a collection', ctx => {
    const expectedOutput = [
      'The following collections and suites were found.\n',
      'COLLECTIONS',
      '  collection',
      '',
      'SUITES',
      '  collection/suite_1',
      '  collection/suite_2',
    ].join('\n')
    expect(ctx.stdout).to.contain(expectedOutput)
  })

  test
  .do(() => {
    fs.mock({
      suites: {
        meta_collection: {
          nested_collection_1: {suite_1: ''},
          nested_collection_2: {suite_2: ''},
        },
      },
    })
  })
  .finally(() => {
    fs.restore()
  })
  .stdout()
  .command(['list:suites'])
  .it('lists suites in nested collections', ctx => {
    const expectedOutput = [
      'The following collections and suites were found.\n',
      'COLLECTIONS',
      '  meta_collection',
      '    nested_collection_1',
      '    nested_collection_2',
      '',
      'SUITES',
      '  meta_collection/nested_collection_1/suite_1',
      '  meta_collection/nested_collection_2/suite_2',
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
  .command(['list:suites'])
  .catch(error => {
    expect(error.message).to.equal('Could not find suites directory')
  })
  .it('notes that the suites directory is absent')

  test
  .do(() => {
    fs.mock({suites: null})
  })
  .finally(() => {
    fs.restore()
  })
  .stderr()
  .command(['list:suites'])
  .catch(error => {
    expect(error.message).to.equal('No collections or suites found')
  })
  .it('notes when no collections or suites could be found')
})
