import {format} from 'date-fns/fp'
import * as fs from 'node:fs'
import * as ExcelJS from 'exceljs'

export default class Export {
  static dateTimeFormat = format('yyyy-MM-dd-hhmm')

  public static async write(
    name: string,
    data: {
      matched: string;
      case_name: string;
      assertion_name: string;
      expected: string;
      actual: string;
    }[],
  ): Promise<string> {
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports')
    }

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'wate - Web API Testing tool'
    workbook.title = name
    const worksheet = workbook.addWorksheet('Report')
    worksheet.columns = [
      {header: 'OK?', key: 'matched', width: 10},
      {header: 'Case Name', key: 'case_name', width: 32},
      {header: 'Assertion Name', key: 'assertion_name', width: 20},
      {header: 'Expected', key: 'expected', width: 20},
      {header: 'Actual', key: 'actual', width: 20},
    ]
    const columns = [
      'matched',
      'case_name',
      'assertion_name',
      'expected',
      'actual',
    ]
    worksheet.autoFilter = {
      from: 'B1',
      to: 'C1',
    }
    worksheet.addRows(data)
    // Styling and aligning
    // Style header
    worksheet.getRow(1).font = {size: 14, bold: true}
    // Color cells (success, error)
    worksheet.getRows(2, data.length)?.forEach(row => {
      const fillError: ExcelJS.Fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {argb: 'F08080'},
      }
      const fillSuccess: ExcelJS.Fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {argb: '008810'},
      }

      for (const name of columns) {
        const currentCell = row.getCell(name)
        currentCell.fill =
          row.getCell('matched').value === '✓' ? fillSuccess : fillError
        currentCell.font = {
          size: 12,
          color: {argb: 'FFFFFFFF'},
        }
      }
    })
    // Align columns
    worksheet.columns.every(col => (col.alignment = {vertical: 'top'}))
    // Wrap text for expected and asserted
    const expectedCol = worksheet.getColumn('expected')
    expectedCol.alignment = {wrapText: true, horizontal: 'right'}
    const actualCol = worksheet.getColumn('actual')
    actualCol.alignment = {wrapText: true, horizontal: 'right'}

    const filename = `reports/${Export.dateTimeFormat(new Date())}_${name}.xlsx`

    await workbook.xlsx.writeFile(filename)

    return filename
  }
}
