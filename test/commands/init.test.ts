import {expect, test} from '@oclif/test'
import * as mockfs from 'mock-fs'
import * as path from 'path'

const mockFolders = (conf: any) => {
  conf = {
    ...conf,
    'package.json': mockfs.load(path.resolve(__dirname, '../../package.json')),
    'tsconfig.json': mockfs.load(
      path.resolve(__dirname, '../../tsconfig.json')
    ),
    src: mockfs.load(path.resolve(__dirname, '../../src')),
    test: mockfs.load(path.resolve(__dirname, '../../test')),
    node_modules: mockfs.load(path.resolve(__dirname, '../../node_modules')),
    '.nyc_output': mockfs.load(path.resolve(__dirname, '../../.nyc_output')),
  }
  mockfs(conf, {createCwd: true, createTmp: false})
}

describe('init', () => {
  test
  .do(() => {
    mockFolders({})
  })
  .finally(() => {
    mockfs.restore()
  })
  .stdout()
  .command(['init'])
  .it('initializes directories', ctx => {
    expect(ctx.stdout).to.contain(
      'Setting up requests directory\nSetting up suites directory\nSetting up envs directory\nSetup finished.\n\n'
    )
  })

  test
  .do(() => {
    mockFolders({requests: null})
  })
  .finally(() => {
    mockfs.restore()
  })
  .stdout()
  .command(['init'])
  .exit(1)
  .it('notes that the requests directory does already existing', ctx => {
    expect(ctx.stdout).to.contain(
      'Found existing requests directory. Exiting.'
    )
  })

  test
  .do(() => {
    mockFolders({envs: null})
  })
  .finally(() => {
    mockfs.restore()
  })
  .stdout()
  .command(['init'])
  .exit(1)
  .it('notes that the envs directory does already existing', ctx => {
    expect(ctx.stdout).to.contain('Found existing envs directory. Exiting.')
  })

  test
  .do(() => {
    mockFolders({suites: null})
  })
  .finally(() => {
    mockfs.restore()
  })
  .stdout()
  .command(['init'])
  .exit(1)
  .it('notes that the suites directory does already existing', ctx => {
    expect(ctx.stdout).to.contain('Found existing suites directory. Exiting.')
  })
})
