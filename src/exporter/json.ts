import * as fs from 'node:fs'
import {format} from 'date-fns/fp'

export default class JsonExport {
  static dateTimeFormat = format('yyyy-MM-dd-HHmm');

  public static write(name: string, data: any): string {
    if (!fs.existsSync('exports')) {
      fs.mkdirSync('exports')
    }

    const filename = `exports/${JsonExport.dateTimeFormat(
      new Date(),
    )}_${name}.json`
    fs.writeFileSync(filename, JSON.stringify(data))

    return filename
  }
}
