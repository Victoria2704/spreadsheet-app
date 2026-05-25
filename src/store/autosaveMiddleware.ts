import type { Middleware } from '@reduxjs/toolkit'
import { buildPreview } from '@/tableHelpers'
import { saveDocument } from '@/store/documentsSlice'
import { setHasUnsavedChanges, setSaveStatus } from '@/store/uiSlice'
import type { AppDispatch, RootState } from '@/store/store'

let autosaveTimer: ReturnType<typeof setTimeout> | undefined

const actionsForSave = new Set([
  'spreadsheet/setCellValue',
  'spreadsheet/setManyCells',
  'spreadsheet/setCellStyle',
  'spreadsheet/clearCells',
  'spreadsheet/setColumnWidth',
  'spreadsheet/setRowHeight',
  'spreadsheet/addRow',
  'spreadsheet/deleteRow',
  'spreadsheet/addColumn',
  'spreadsheet/deleteColumn',
  'spreadsheet/undo',
  'spreadsheet/redo',
])

function isActionWithType(action: unknown): action is { type: string } {
  return (
    typeof action === 'object' &&
    action !== null &&
    'type' in action &&
    typeof action.type === 'string'
  )
}

export const autosaveMiddleware: Middleware =
  (storeApi) => (next) => (action) => {
    const result = next(action)

    if (!isActionWithType(action) || !actionsForSave.has(action.type)) {
      return result
    }

    const state = storeApi.getState() as RootState
    const document = state.documents.items.find(
      (item) => item.id === state.documents.activeDocumentId,
    )

    if (!document) {
      return result
    }

    const dispatch = storeApi.dispatch as AppDispatch

    dispatch(setHasUnsavedChanges(true))
    dispatch(setSaveStatus('saving'))

    if (autosaveTimer) {
      clearTimeout(autosaveTimer)
    }

    autosaveTimer = setTimeout(() => {
      const nextState = storeApi.getState() as RootState
      const nextDocument = nextState.documents.items.find(
        (item) => item.id === nextState.documents.activeDocumentId,
      )

      if (!nextDocument) {
        return
      }

      dispatch(
        saveDocument({
          document: nextDocument,
          rowsCount: nextState.spreadsheet.rowsCount,
          columnsCount: nextState.spreadsheet.columnsCount,
          cells: nextState.spreadsheet.cellValues,
          preview: buildPreview(nextState.spreadsheet.cellValues),
        }),
      )
    }, 500)

    return result
  }
