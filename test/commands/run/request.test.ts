import {expect, test} from '@oclif/test'
import fs from '../../mockfs'
import * as path from 'path'

const fixturePath = `${__dirname}/../../fixtures`

describe('run:request', () => {
  test
  .stderr()
  .command(['run:request', 'dne', 'dne'])
  .catch(error => {
    expect(error.message).to.equal('Environment "dne" not found')
  })
  .it('errors if the environment does not exist')

  test
  .do(() => {
    fs.mock({
      environments: {
        'env.json': fs.fixtureFile(
          path.join(fixturePath, 'environments', 'full_env.json')
        ),
      },
      requests: {
        request_1: {
          'request.http': fs.fixtureFile(
            path.join(fixturePath, 'requests', 'request_1', 'request.http')
          ),
        },
      },
    })
  })
  .finally(() => {
    fs.restore()
  })
  .stdout()
  .command(['run:request', 'env', 'request_1'])
  .it('performs a valid request', ctx => {
    expect(ctx.stdout).to.contain(
      [
        'Running request "request_1" with environment "env" against "my-host"',
      ].join('\n')
    )
  })
})
