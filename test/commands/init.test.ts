import {expect, test} from '@oclif/test'
import fs from '../mockfs'

describe('init', () => {
  test
  .do(() => {
    fs.mock({})
  })
  .finally(() => {
    fs.restore()
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
    fs.mock({requests: null})
  })
  .finally(() => {
    fs.restore()
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
    fs.mock({envs: null})
  })
  .finally(() => {
    fs.restore()
  })
  .stdout()
  .command(['init'])
  .exit(1)
  .it('notes that the envs directory does already existing', ctx => {
    expect(ctx.stdout).to.contain('Found existing envs directory. Exiting.')
  })

  test
  .do(() => {
    fs.mock({suites: null})
  })
  .finally(() => {
    fs.restore()
  })
  .stdout()
  .command(['init'])
  .exit(1)
  .it('notes that the suites directory does already existing', ctx => {
    expect(ctx.stdout).to.contain('Found existing suites directory. Exiting.')
  })
})
