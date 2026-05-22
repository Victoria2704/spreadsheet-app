import type { CellData, CellType } from '@/types'

export function getCellId(row: number, column: number) {
  return `${row}-${column}`
}

export function getColumnName(column: number) {
  let name = ''
  let number = column + 1

  while (number > 0) {
    const letterNumber = (number - 1) % 26
    name = String.fromCharCode(65 + letterNumber) + name
    number = Math.floor((number - 1) / 26)
  }

  return name
}

export function getCellType(value: string): CellType {
  const text = value.trim().toLowerCase()

  if (value.trim().startsWith('=')) {
    return 'formula'
  }

  if (
    text === 'true' ||
    text === 'false' ||
    text === 'истина' ||
    text === 'ложь'
  ) {
    return 'boolean'
  }

  if (value.trim() !== '' && !Number.isNaN(Number(value))) {
    return 'number'
  }

  return 'string'
}

function getCellPosition(cellName: string) {
  const result = cellName.match(/^([A-Z]+)(\d+)$/)

  if (!result) {
    return { row: 1, column: 0 }
  }

  let column = 0

  for (const letter of result[1]) {
    column = column * 26 + letter.charCodeAt(0) - 64
  }

  return {
    row: Number(result[2]),
    column: column - 1,
  }
}

export function calculateFormula(
  value: string,
  cellValues: Record<string, CellData>,
): string {
  const formula = value.slice(1).replaceAll(' ', '').toUpperCase()

  function getNumber(text: string): number {
    if (/^[A-Z]+\d+$/.test(text)) {
      const cell = getCellPosition(text)
      const cellData = cellValues[getCellId(cell.row, cell.column)]

      if (cellData?.type === 'formula') {
        return Number(calculateFormula(cellData.value, cellValues)) || 0
      }

      return Number(cellData?.value) || 0
    }

    return Number(text) || 0
  }

  function getRangeNumbers(startCell: string, endCell: string) {
    const start = getCellPosition(startCell)
    const end = getCellPosition(endCell)
    const numbers = []

    for (
      let row = Math.min(start.row, end.row);
      row <= Math.max(start.row, end.row);
      row += 1
    ) {
      for (
        let column = Math.min(start.column, end.column);
        column <= Math.max(start.column, end.column);
        column += 1
      ) {
        const cellData = cellValues[getCellId(row, column)]

        if (cellData?.type === 'formula') {
          numbers.push(
            Number(calculateFormula(cellData.value, cellValues)) || 0,
          )
        } else {
          numbers.push(Number(cellData?.value) || 0)
        }
      }
    }

    return numbers
  }

  const sumFormula = formula.match(/^SUM\(([A-Z]+\d+):([A-Z]+\d+)\)$/)

  if (sumFormula) {
    const numbers = getRangeNumbers(sumFormula[1], sumFormula[2])
    const sum = numbers.reduce((result, number) => result + number, 0)

    return String(sum)
  }

  const averageFormula = formula.match(/^AVERAGE\(([A-Z]+\d+):([A-Z]+\d+)\)$/)

  if (averageFormula) {
    const numbers = getRangeNumbers(averageFormula[1], averageFormula[2])
    const sum = numbers.reduce((result, number) => result + number, 0)

    return String(sum / numbers.length)
  }

  const simpleFormula = formula.match(
    /^([A-Z]+\d+|-?\d+(\.\d+)?)([+\-*/])([A-Z]+\d+|-?\d+(\.\d+)?)$/,
  )

  if (!simpleFormula) {
    return '#ERROR'
  }

  const left = getNumber(simpleFormula[1])
  const operator = simpleFormula[3]
  const right = getNumber(simpleFormula[4])

  if (operator === '+') {
    return String(left + right)
  }

  if (operator === '-') {
    return String(left - right)
  }

  if (operator === '*') {
    return String(left * right)
  }

  if (right === 0) {
    return '#ERROR'
  }

  return String(left / right)
}

export function getCellText(
  cellData: CellData | undefined,
  cellValues: Record<string, CellData>,
) {
  if (!cellData) {
    return ''
  }

  if (cellData.type === 'formula') {
    return calculateFormula(cellData.value, cellValues)
  }

  return cellData.value
}

export function addRowToCells(
  currentValues: Record<string, CellData>,
  rowForAdd: number,
) {
  const newValues: Record<string, CellData> = {}

  Object.entries(currentValues).forEach(([cellId, cellData]) => {
    const [rowText, columnText] = cellId.split('-')
    const row = Number(rowText)
    const column = Number(columnText)
    const newRow = row >= rowForAdd ? row + 1 : row

    newValues[getCellId(newRow, column)] = cellData
  })

  return newValues
}

export function deleteRowFromCells(
  currentValues: Record<string, CellData>,
  rowForDelete: number,
) {
  const newValues: Record<string, CellData> = {}

  Object.entries(currentValues).forEach(([cellId, cellData]) => {
    const [rowText, columnText] = cellId.split('-')
    const row = Number(rowText)
    const column = Number(columnText)

    if (row !== rowForDelete) {
      const newRow = row > rowForDelete ? row - 1 : row

      newValues[getCellId(newRow, column)] = cellData
    }
  })

  return newValues
}

export function addColumnToCells(
  currentValues: Record<string, CellData>,
  columnForAdd: number,
) {
  const newValues: Record<string, CellData> = {}

  Object.entries(currentValues).forEach(([cellId, cellData]) => {
    const [rowText, columnText] = cellId.split('-')
    const row = Number(rowText)
    const column = Number(columnText)
    const newColumn = column >= columnForAdd ? column + 1 : column

    newValues[getCellId(row, newColumn)] = cellData
  })

  return newValues
}

export function deleteColumnFromCells(
  currentValues: Record<string, CellData>,
  columnForDelete: number,
) {
  const newValues: Record<string, CellData> = {}

  Object.entries(currentValues).forEach(([cellId, cellData]) => {
    const [rowText, columnText] = cellId.split('-')
    const row = Number(rowText)
    const column = Number(columnText)

    if (column !== columnForDelete) {
      const newColumn = column > columnForDelete ? column - 1 : column

      newValues[getCellId(row, newColumn)] = cellData
    }
  })

  return newValues
}

export function addIndexToObject(
  currentValues: Record<number, number>,
  indexForAdd: number,
) {
  const newValues: Record<number, number> = {}

  Object.entries(currentValues).forEach(([indexText, value]) => {
    const index = Number(indexText)
    const newIndex = index >= indexForAdd ? index + 1 : index

    newValues[newIndex] = value
  })

  return newValues
}

export function deleteIndexFromObject(
  currentValues: Record<number, number>,
  indexForDelete: number,
) {
  const newValues: Record<number, number> = {}

  Object.entries(currentValues).forEach(([indexText, value]) => {
    const index = Number(indexText)

    if (index !== indexForDelete) {
      const newIndex = index > indexForDelete ? index - 1 : index

      newValues[newIndex] = value
    }
  })

  return newValues
}
