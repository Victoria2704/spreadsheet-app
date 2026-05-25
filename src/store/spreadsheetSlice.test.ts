import { describe, expect, it } from 'vitest'
import spreadsheetReducer, {
  loadDocument,
  redo,
  setCellValue,
  undo,
} from '@/store/spreadsheetSlice'

describe('spreadsheetSlice', () => {
  it('загружает документ в таблицу', () => {
    const state = spreadsheetReducer(
      undefined,
      loadDocument({
        rowsCount: 10,
        columnsCount: 5,
        cellValues: {
          '1-0': { value: 'Привет', type: 'string' },
        },
      }),
    )

    expect(state.rowsCount).toBe(10)
    expect(state.columnsCount).toBe(5)
    expect(state.cellValues['1-0']?.value).toBe('Привет')
  })

  it('делает undo и redo для изменения ячейки', () => {
    let state = spreadsheetReducer(
      undefined,
      setCellValue({
        id: '1-0',
        data: { value: '10', type: 'number' },
      }),
    )

    state = spreadsheetReducer(state, undo())
    expect(state.cellValues['1-0']).toBeUndefined()

    state = spreadsheetReducer(state, redo())
    expect(state.cellValues['1-0']?.value).toBe('10')
  })
})
