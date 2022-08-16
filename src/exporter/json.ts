import * as fs from 'node:fs'
import * as path from 'node:path'
import {format} from 'date-fns/fp'

export default class JsonExport {
  static dateTimeFormat = format('yyyyMMddHHmmssSS');

  public static write(name: string, data: any, dirname = ''): string {
    const folderpath = path.join('exports', dirname)
    if (!fs.existsSync(folderpath)) {
      fs.mkdirSync(folderpath, {recursive: true})
    }

    const filename = `${JsonExport.dateTimeFormat(new Date())}_${name}.json`
    const filepath = path.join(folderpath, filename)
    fs.writeFileSync(filepath, JSON.stringify(data))

    return filepath
  }
}
