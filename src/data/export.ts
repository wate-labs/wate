import * as fs from 'fs'
import * as xlsx from 'xlsx'

export default class Export {
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
    const filename = `reports/${Export.datePrefix()}_${name}.xlsx`
    xlsx.writeFile(workbook, filename)

    return filename
  }

  private static datePrefix(): string {
    const now = new Date()
    const dateParts = [
      now.getFullYear(),
      Export.padDate(now.getMonth() + 1),
      Export.padDate(now.getDate()),
    ]
    return dateParts.join('-')
  }

  private static padDate(dateOrMonth: number): string {
    return dateOrMonth.toString().padStart(2, '0')
  }
}
