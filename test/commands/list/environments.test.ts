import {expect, test} from '@oclif/test'
import fs from '../../mockfs'

describe('list:environments', () => {
  test
  .do(() => {
    fs.mock({environments: {env_1: '', env_2: ''}})
  })
  .finally(() => {
    fs.restore()
  })
  .stdout()
  .command(['list:environments'])
  .it('lists only environments', ctx => {
    const expectedOutput = [
      'The following collections and environments were found.\n',
      'COLLECTIONS',
      '',
      '',
      'ENVIRONMENTS',
      '  env_1',
      '  env_2',
    ].join('\n')
    expect(ctx.stdout).to.contain(expectedOutput)
  })

  test
  .do(() => {
    fs.mock({
      environments: {
        collection: {env_1: '', env_2: ''},
      },
    })
  })
  .finally(() => {
    fs.restore()
  })
  .stdout()
  .command(['list:environments'])
  .it('lists environments in a collection', ctx => {
    const expectedOutput = [
      'The following collections and environments were found.\n',
      'COLLECTIONS',
      '  collection',
      '',
      'ENVIRONMENTS',
      '  collection/env_1',
      '  collection/env_2',
    ].join('\n')
    expect(ctx.stdout).to.contain(expectedOutput)
  })

  test
  .do(() => {
    fs.mock({
      environments: {
        meta_collection: {
          nested_collection_1: {env_1: ''},
          nested_collection_2: {env_2: ''},
        },
      },
    })
  })
  .finally(() => {
    fs.restore()
  })
  .stdout()
  .command(['list:environments'])
  .it('lists environments in nested collections', ctx => {
    const expectedOutput = [
      'The following collections and environments were found.\n',
      'COLLECTIONS',
      '  meta_collection',
      '    nested_collection_1',
      '    nested_collection_2',
      '',
      'ENVIRONMENTS',
      '  meta_collection/nested_collection_1/env_1',
      '  meta_collection/nested_collection_2/env_2',
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
  .command(['list:environments'])
  .catch(error => {
    expect(error.message).to.equal('Could not find environments directory')
  })
  .it('notes that the environments directory is absent')

  test
  .do(() => {
    fs.mock({environments: null})
  })
  .finally(() => {
    fs.restore()
  })
  .stderr()
  .command(['list:environments'])
  .catch(error => {
    expect(error.message).to.equal('No collections or environments found')
  })
  .it('notes when no collections or environments could be found')
})
