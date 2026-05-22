import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { CellData, CellPosition, SelectedRange } from '@/types'
import {
  addColumnToCells,
  addIndexToObject,
  addRowToCells,
  deleteColumnFromCells,
  deleteIndexFromObject,
  deleteRowFromCells,
} from '@/tableHelpers'

export interface SpreadsheetState {
  rowsCount: number
  columnsCount: number
  activeCell: CellPosition | null
  selectedRange: SelectedRange | null
  cellValues: Record<string, CellData>
  columnWidths: Record<number, number>
  rowHeights: Record<number, number>
}

const initialState: SpreadsheetState = {
  rowsCount: 1000,
  columnsCount: 26,
  activeCell: null,
  selectedRange: null,
  cellValues: {},
  columnWidths: {},
  rowHeights: {},
}

export const spreadsheetSlice = createSlice({
  name: 'spreadsheet',
  initialState,
  reducers: {
    setActiveCell: (state, action: PayloadAction<CellPosition | null>) => {
      state.activeCell = action.payload
    },
    setSelectedRange: (state, action: PayloadAction<SelectedRange | null>) => {
      state.selectedRange = action.payload
    },
    setCellValue: (
      state,
      action: PayloadAction<{ id: string; data: CellData }>,
    ) => {
      const { id, data } = action.payload
      state.cellValues[id] = data
    },
    setColumnWidth: (
      state,
      action: PayloadAction<{ index: number; width: number }>,
    ) => {
      const { index, width } = action.payload
      state.columnWidths[index] = width
    },
    setRowHeight: (
      state,
      action: PayloadAction<{ index: number; height: number }>,
    ) => {
      const { index, height } = action.payload
      state.rowHeights[index] = height
    },
    addRow: (state, action: PayloadAction<number>) => {
      state.cellValues = addRowToCells(state.cellValues, action.payload)
      state.rowHeights = addIndexToObject(state.rowHeights, action.payload)
      state.rowsCount += 1
    },
    deleteRow: (state, action: PayloadAction<number>) => {
      if (state.rowsCount > 1) {
        state.cellValues = deleteRowFromCells(state.cellValues, action.payload)
        state.rowHeights = deleteIndexFromObject(
          state.rowHeights,
          action.payload,
        )
        state.rowsCount -= 1
      }
    },
    addColumn: (state, action: PayloadAction<number>) => {
      state.cellValues = addColumnToCells(state.cellValues, action.payload)
      state.columnWidths = addIndexToObject(state.columnWidths, action.payload)
      state.columnsCount += 1
    },
    deleteColumn: (state, action: PayloadAction<number>) => {
      if (state.columnsCount > 1) {
        state.cellValues = deleteColumnFromCells(
          state.cellValues,
          action.payload,
        )
        state.columnWidths = deleteIndexFromObject(
          state.columnWidths,
          action.payload,
        )
        state.columnsCount -= 1
      }
    },
  },
})

export const {
  setActiveCell,
  setSelectedRange,
  setCellValue,
  setColumnWidth,
  setRowHeight,
  addRow,
  deleteRow,
  addColumn,
  deleteColumn,
} = spreadsheetSlice.actions

export default spreadsheetSlice.reducer
