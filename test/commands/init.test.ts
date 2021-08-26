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
      [
        'Creating requests directory',
        'Creating suites directory',
        'Creating environments directory',
        'Setup finished.',
      ].join('\n'),
    )
  })

  test
  .do(() => {
    fs.mock({requests: null})
  })
  .finally(() => {
    fs.restore()
  })
  .stderr()
  .command(['init'])
  .catch(error => {
    expect(error.message).to.equal('Found existing requests directory.')
  })
  .it('errors out when the requests directory does already exist')

  test
  .do(() => {
    fs.mock({environments: null})
  })
  .finally(() => {
    fs.restore()
  })
  .stderr()
  .command(['init'])
  .catch(error => {
    expect(error.message).to.equal('Found existing environments directory.')
  })
  .it('errors out when the environments directory does already exist')

  test
  .do(() => {
    fs.mock({suites: null})
  })
  .finally(() => {
    fs.restore()
  })
  .stderr()
  .command(['init'])
  .catch(error => {
    expect(error.message).to.equal('Found existing suites directory.')
  })
  .it('errors out when the suites directory does already existing')
})
