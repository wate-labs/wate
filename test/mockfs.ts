import * as mockfs from 'mock-fs'
import * as path from 'path'

const fs = {
  mock(conf: any) {
    conf = {
      ...conf,
      'package.json': mockfs.load(path.resolve(__dirname, '../package.json')),
      'tsconfig.json': mockfs.load(path.resolve(__dirname, '../tsconfig.json')),
      src: mockfs.load(path.resolve(__dirname, '../src')),
      test: mockfs.load(path.resolve(__dirname, '../test')),
      node_modules: mockfs.load(path.resolve(__dirname, '../node_modules')),
      '.nyc_output': mockfs.load(path.resolve(__dirname, '../.nyc_output')),
    }
    mockfs(conf, {createCwd: true, createTmp: false})
  },

  restore() {
    mockfs.restore()
  },
}

export default fs
