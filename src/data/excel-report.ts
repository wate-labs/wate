import * as fs from 'node:fs'
import {format} from 'date-fns/fp'
import * as ExcelJS from 'exceljs'

export default class ExcelReport {
  static dateTimeFormat = format('yyyyMMddHHmmssSS');

  public static async write(
    name: string,
    data: {
      matched: string;
      case_name: string;
      name: string;
      expected: string;
      actual: string;
      debug: string;
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
      {header: 'Case Name', key: 'case_name', width: 32},
      {header: 'Name', key: 'name', width: 20},
      {header: 'OK?', key: 'matched', width: 5},
      {header: 'Expected', key: 'expected', width: 20},
      {header: 'Actual', key: 'actual', width: 20},
      {header: 'Debug', key: 'debug', width: 150},
    ]
    const columns = [
      'case_name',
      'name',
      'matched',
      'expected',
      'actual',
      'debug',
    ]
    worksheet.autoFilter = {
      from: 'A1',
      to: 'B1',
    }
    worksheet.addRows(data)
    // Styling and aligning
    // Style header
    worksheet.getRow(1).font = {size: 14, bold: true}
    // Color cells (success, error)
    let caseSectionRow: ExcelJS.Row|null = null
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

        const cellValue = row.getCell('matched').value
        if (cellValue !== '') {
          currentCell.fill = cellValue === '✓' ? fillSuccess : fillError
          currentCell.font = {
            size: 12,
            color: {argb: 'FFFFFFFF'},
          }
        }
      }

      const currentCaseNameCell = row.getCell('case_name')
      const caseSectionCell = caseSectionRow ? caseSectionRow.getCell('case_name') : null
      if (caseSectionCell && currentCaseNameCell.value === caseSectionCell.value) {
        const color = currentCaseNameCell.fill ? '00000000' : 'FFFFFFFF'
        currentCaseNameCell.font = {
          size: 1,
          color: {argb: color},
        }
      } else {
        caseSectionRow = row
      }
    })
    // Align columns
    worksheet.columns.every(col => {
      col.alignment = {vertical: 'top'}

      return col
    })
    // Wrap text for expected and asserted
    const matchedCol = worksheet.getColumn('matched')
    matchedCol.alignment = {horizontal: 'center', vertical: 'top'}
    const expectedCol = worksheet.getColumn('expected')
    expectedCol.alignment = {wrapText: true, horizontal: 'right', vertical: 'top'}
    const actualCol = worksheet.getColumn('actual')
    actualCol.alignment = {wrapText: true, horizontal: 'right', vertical: 'top'}

    // Hide debug column
    const debugCol = worksheet.getColumn('debug')
    debugCol.hidden = true

    const filename = `reports/${ExcelReport.dateTimeFormat(
      new Date(),
    )}_${name}.xlsx`

    await workbook.xlsx.writeFile(filename)

    return filename
  }
}
