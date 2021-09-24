import * as fs from 'fs'
import * as path from 'path'
import Environment from '../environment'
import SchemaValidator, {ValidationSchema} from '../validator/schema'

export default class EnvironmentLoader {
  static schema: ValidationSchema = {
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
      const validation = SchemaValidator.validate(
        EnvironmentLoader.schema,
        content,
      )
      if (!validation.isValid) {
        throw new Error(
          `"${validation.error?.path}" ${validation.error?.message}`,
        )
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
