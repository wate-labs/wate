import * as fs from 'fs'
import * as path from 'path'
import Ajv, {JSONSchemaType} from 'ajv'
import Environment from '../environment'

export default class EnvironmentLoader {
  static schema: JSONSchemaType<Environment> = {
    type: 'object',
    properties: {
      host: {type: 'string'},
      scheme: {type: 'string', enum: ['https', 'http']},
    },
    required: ['host'],
    additionalProperties: false,
  }

  public static load(envPath: string, name: string): Environment {
    const filePath = path.join(envPath, `${name}.json`)
    if (!fs.existsSync(filePath)) {
      throw new Error(`Environment "${name}" not found`)
    }
    try {
      const content = JSON.parse(fs.readFileSync(filePath).toString())
      const scheme = content.scheme ?? 'https'
      const host = content.host ?? null
      const ajv = new Ajv()
      const validate = ajv.compile(EnvironmentLoader.schema)
      if (!validate(content) && validate.errors) {
        let message = ''
        for (const err of validate.errors) {
          message += `${err.message}`
        }
        throw new Error(message)
      }

      return {
        scheme,
        host,
      }
    } catch (error) {
      throw new Error(`Malformed environment "${name}": ${error.message}`)
    }
  }
}
