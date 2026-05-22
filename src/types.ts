export type CellPosition = {
  row: number
  column: number
}

export type SelectedRange = {
  start: CellPosition
  end: CellPosition
}

export type CellType = 'string' | 'number' | 'boolean' | 'formula'

export type CellData = {
  value: string
  type: CellType
}

export type ContextMenu = {
  x: number
  y: number
  row: number
  column: number
}
