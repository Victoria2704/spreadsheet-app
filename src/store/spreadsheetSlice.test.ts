import { describe, expect, it } from 'vitest'
import spreadsheetReducer, {
  clearCells,
  loadDocument,
  redo,
  setCellValue,
  setCellStyle,
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

  it('сохраняет стиль ячейки', () => {
    const state = spreadsheetReducer(
      undefined,
      setCellStyle({
        ids: ['1-0'],
        style: { bold: true, backgroundColor: '#ff0000' },
      }),
    )

    expect(state.cellValues['1-0']?.style?.bold).toBe(true)
    expect(state.cellValues['1-0']?.style?.backgroundColor).toBe('#ff0000')
  })

  it('очищает ячейки', () => {
    let state = spreadsheetReducer(
      undefined,
      setCellValue({
        id: '1-0',
        data: { value: '10', type: 'number' },
      }),
    )

    state = spreadsheetReducer(state, clearCells(['1-0']))

    expect(state.cellValues['1-0']).toBeUndefined()
  })
})
