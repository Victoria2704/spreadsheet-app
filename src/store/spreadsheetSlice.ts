import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type {
  CellData,
  CellPosition,
  SelectedRange,
  SpreadsheetSnapshot,
} from '@/types'
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
  past: SpreadsheetSnapshot[]
  future: SpreadsheetSnapshot[]
}

const initialState: SpreadsheetState = {
  rowsCount: 1000,
  columnsCount: 26,
  activeCell: null,
  selectedRange: null,
  cellValues: {},
  columnWidths: {},
  rowHeights: {},
  past: [],
  future: [],
}

function getSnapshot(state: SpreadsheetState): SpreadsheetSnapshot {
  return {
    rowsCount: state.rowsCount,
    columnsCount: state.columnsCount,
    cellValues: { ...state.cellValues },
    columnWidths: { ...state.columnWidths },
    rowHeights: { ...state.rowHeights },
  }
}

function rememberState(state: SpreadsheetState) {
  state.past.push(getSnapshot(state))
  state.future = []

  if (state.past.length > 30) {
    state.past.shift()
  }
}

function applySnapshot(state: SpreadsheetState, snapshot: SpreadsheetSnapshot) {
  state.rowsCount = snapshot.rowsCount
  state.columnsCount = snapshot.columnsCount
  state.cellValues = snapshot.cellValues
  state.columnWidths = snapshot.columnWidths
  state.rowHeights = snapshot.rowHeights
}

export const spreadsheetSlice = createSlice({
  name: 'spreadsheet',
  initialState,
  reducers: {
    loadDocument: (
      state,
      action: PayloadAction<{
        rowsCount: number
        columnsCount: number
        cellValues: Record<string, CellData>
      }>,
    ) => {
      state.rowsCount = action.payload.rowsCount
      state.columnsCount = action.payload.columnsCount
      state.cellValues = action.payload.cellValues
      state.activeCell = null
      state.selectedRange = null
      state.columnWidths = {}
      state.rowHeights = {}
      state.past = []
      state.future = []
    },
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
      rememberState(state)
      const { id, data } = action.payload
      state.cellValues[id] = data
    },
    setColumnWidth: (
      state,
      action: PayloadAction<{ index: number; width: number }>,
    ) => {
      rememberState(state)
      const { index, width } = action.payload
      state.columnWidths[index] = width
    },
    setRowHeight: (
      state,
      action: PayloadAction<{ index: number; height: number }>,
    ) => {
      rememberState(state)
      const { index, height } = action.payload
      state.rowHeights[index] = height
    },
    addRow: (state, action: PayloadAction<number>) => {
      rememberState(state)
      state.cellValues = addRowToCells(state.cellValues, action.payload)
      state.rowHeights = addIndexToObject(state.rowHeights, action.payload)
      state.rowsCount += 1
    },
    deleteRow: (state, action: PayloadAction<number>) => {
      if (state.rowsCount > 1) {
        rememberState(state)
        state.cellValues = deleteRowFromCells(state.cellValues, action.payload)
        state.rowHeights = deleteIndexFromObject(
          state.rowHeights,
          action.payload,
        )
        state.rowsCount -= 1
      }
    },
    addColumn: (state, action: PayloadAction<number>) => {
      rememberState(state)
      state.cellValues = addColumnToCells(state.cellValues, action.payload)
      state.columnWidths = addIndexToObject(state.columnWidths, action.payload)
      state.columnsCount += 1
    },
    deleteColumn: (state, action: PayloadAction<number>) => {
      if (state.columnsCount > 1) {
        rememberState(state)
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
    undo: (state) => {
      const previous = state.past.pop()

      if (!previous) {
        return
      }

      state.future.push(getSnapshot(state))
      applySnapshot(state, previous)
    },
    redo: (state) => {
      const next = state.future.pop()

      if (!next) {
        return
      }

      state.past.push(getSnapshot(state))
      applySnapshot(state, next)
    },
  },
})

export const {
  loadDocument,
  setActiveCell,
  setSelectedRange,
  setCellValue,
  setColumnWidth,
  setRowHeight,
  addRow,
  deleteRow,
  addColumn,
  deleteColumn,
  undo,
  redo,
} = spreadsheetSlice.actions

export default spreadsheetSlice.reducer
