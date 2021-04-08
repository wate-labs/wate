import * as fs from 'fs'

export default class EnvironmentLoader {
  public static load(filePath: string): Environment {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File ${filePath} not found`)
    }
    const content = JSON.parse(fs.readFileSync(filePath).toString())
    const scheme = content.scheme ?? 'https'
    const host = content.host ?? null

    return {
      scheme,
      host,
    }
  }
}

export interface Environment {
  scheme: string;
  host: string;
}
