import Ajv, {Schema, SchemaObject} from 'ajv'

export default class SchemaValidator {
  public static validate(schema: Schema, data: any): ValidationResult {
    const ajv = new Ajv()
    const validate = ajv.compile(schema)
    if (!validate(data) && validate.errors) {
      let error
      // Ajv somehow returns only ever the first error.
      for (const e of validate.errors) {
        error = {
          path: e.instancePath === '' ? '/' : e.instancePath,
          message: e.message,
        }
      }

      return {
        isValid: false,
        error: error,
      }
    }

    return {
      isValid: true,
    }
  }
}

export type ValidationSchema = SchemaObject

export interface ValidationResult {
  isValid: boolean;
  error?: ValidationError;
}

interface ValidationError {
  path: string;
  message?: string;
}
