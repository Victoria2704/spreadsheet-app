export type CellPosition = {
  row: number
  column: number
}

export type SelectedRange = {
  start: CellPosition
  end: CellPosition
}

export type CellType = 'string' | 'number' | 'boolean' | 'formula'

export type TextAlign = 'left' | 'center' | 'right'

export type NumberFormat = 'normal' | 'percent' | 'currency' | 'date'

export type CellStyle = {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  backgroundColor?: string
  textColor?: string
  align?: TextAlign
  numberFormat?: NumberFormat
}

export type CellData = {
  value: string
  type: CellType
  style?: CellStyle
}

export type SpreadsheetSnapshot = {
  rowsCount: number
  columnsCount: number
  cellValues: Record<string, CellData>
  columnWidths: Record<number, number>
  rowHeights: Record<number, number>
}

export type ContextMenu = {
  x: number
  y: number
  row: number
  column: number
}

export type DocumentMeta = {
  id: string
  ownerId: string
  title: string
  createdAt: string
  updatedAt: string
  rowsCount: number
  columnsCount: number
  preview: string[][]
  cells: Record<string, CellData>
}

export type SaveStatus = 'saved' | 'saving' | 'error'

export type User = {
  id: string
  name: string
  email: string
  registeredAt: string
}
