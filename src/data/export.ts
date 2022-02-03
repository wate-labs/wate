import {format} from 'date-fns/fp'
import * as fs from 'fs'
import * as xlsx from 'xlsx'

export default class Export {
  static dateTimeFormat = format('yyyy-MM-dd-hhmm')

  public static write(
    name: string,
    data: {
      '': string;
      case_name: string;
      assertion_name: string;
      expected: string;
      actual: string;
    }[],
  ): string {
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports')
    }
    const workbook = xlsx.utils.book_new()
    const sheet = xlsx.utils.json_to_sheet(data)
    xlsx.utils.book_append_sheet(workbook, sheet)
    const filename = `reports/${Export.dateTimeFormat(new Date())}_${name}.xlsx`
    xlsx.writeFile(workbook, filename)

    return filename
  }
}
