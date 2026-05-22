import { useEffect, useState, type MouseEvent as ReactMouseEvent } from 'react'
import {
  getCellId,
  getCellText,
  getCellType,
  getColumnName,
} from './tableHelpers'
import { useAppDispatch, useAppSelector } from './store/hooks'
import {
  setActiveCell,
  setSelectedRange,
  setCellValue,
  setColumnWidth,
  setRowHeight,
  addRow as addRowAction,
  deleteRow as deleteRowAction,
  addColumn as addColumnAction,
  deleteColumn as deleteColumnAction,
} from './store/spreadsheetSlice'
import type { CellPosition, ContextMenu } from './types'
import './index.css'

const DEFAULT_COLUMN_WIDTH = 100
const DEFAULT_ROW_HEIGHT = 28

function App() {
  const dispatch = useAppDispatch()
  const {
    rowsCount,
    columnsCount,
    activeCell,
    selectedRange,
    cellValues,
    columnWidths,
    rowHeights,
  } = useAppSelector((state) => state.spreadsheet)

  const [editingCell, setEditingCell] = useState<CellPosition | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)

  // Считаем точную ширину таблицы, чтобы при изменении размера колонок ничего не ломалось
  let totalWidth = 50
  for (let i = 0; i < columnsCount; i++) {
    totalWidth += columnWidths[i] ?? DEFAULT_COLUMN_WIDTH
  }
  
  const columns = Array.from({ length: columnsCount }, (_, index) => getColumnName(index))

  function isCellSelected(r: number, c: number) {
    if (!selectedRange) return false
    const startRow = Math.min(selectedRange.start.row, selectedRange.end.row)
    const endRow = Math.max(selectedRange.start.row, selectedRange.end.row)
    const startCol = Math.min(selectedRange.start.column, selectedRange.end.column)
    const endCol = Math.max(selectedRange.start.column, selectedRange.end.column)
    return r >= startRow && r <= endRow && c >= startCol && c <= endCol
  }

  function isActiveCell(r: number, c: number) {
    return activeCell?.row === r && activeCell.column === c
  }

  function isEditingCell(r: number, c: number) {
    return editingCell?.row === r && editingCell.column === c
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Enter' || !activeCell || editingCell) {
        return
      }

      const cellId = getCellId(activeCell.row, activeCell.column)

      event.preventDefault()
      setEditingCell(activeCell)
      setEditingValue(cellValues[cellId]?.value ?? '')
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeCell, cellValues, editingCell])

  useEffect(() => {
    function closeContextMenu() {
      setContextMenu(null)
    }

    window.addEventListener('click', closeContextMenu)

    return () => {
      window.removeEventListener('click', closeContextMenu)
    }
  }, [])

  function getActiveCellName() {
    if (!activeCell) {
      return ''
    }

    return `${columns[activeCell.column]}${activeCell.row}`
  }

  function getActiveCellValue() {
    if (!activeCell) {
      return ''
    }

    const cellId = getCellId(activeCell.row, activeCell.column)

    if (editingCell) {
      return editingValue
    }

    return cellValues[cellId]?.value ?? ''
  }

  function getColumnWidth(column: number) {
    return columnWidths[column] ?? DEFAULT_COLUMN_WIDTH
  }

  function getRowHeight(row: number) {
    return rowHeights[row] ?? DEFAULT_ROW_HEIGHT
  }

  function startColumnResize(event: ReactMouseEvent, column: number) {
    event.preventDefault()
    event.stopPropagation()

    const startX = event.clientX
    const startWidth = getColumnWidth(column)

    function resize(moveEvent: MouseEvent) {
      const newWidth = startWidth + moveEvent.clientX - startX

      dispatch(setColumnWidth({ index: column, width: Math.max(50, newWidth) }))
    }

    function stopResize() {
      window.removeEventListener('mousemove', resize)
      window.removeEventListener('mouseup', stopResize)
    }

    window.addEventListener('mousemove', resize)
    window.addEventListener('mouseup', stopResize)
  }

  function startRowResize(event: ReactMouseEvent, row: number) {
    event.preventDefault()
    event.stopPropagation()

    const startY = event.clientY
    const startHeight = getRowHeight(row)

    function resize(moveEvent: MouseEvent) {
      const newHeight = startHeight + moveEvent.clientY - startY

      dispatch(setRowHeight({ index: row, height: Math.max(22, newHeight) }))
    }

    function stopResize() {
      window.removeEventListener('mousemove', resize)
      window.removeEventListener('mouseup', stopResize)
    }

    window.addEventListener('mousemove', resize)
    window.addEventListener('mouseup', stopResize)
  }

  function openContextMenu(event: ReactMouseEvent, row: number, column: number) {
    event.preventDefault()

    const clickedCell = { row, column }

    dispatch(setActiveCell(clickedCell))
    dispatch(setSelectedRange({
      start: clickedCell,
      end: clickedCell,
    }))
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      row,
      column,
    })
  }

  function addRow(rowForAdd: number) {
    dispatch(addRowAction(rowForAdd))
    setContextMenu(null)
    dispatch(setActiveCell(null))
    dispatch(setSelectedRange(null))
  }

  function deleteRow(rowForDelete: number) {
    if (rowsCount === 1) {
      return
    }

    dispatch(deleteRowAction(rowForDelete))
    setContextMenu(null)
    dispatch(setActiveCell(null))
    dispatch(setSelectedRange(null))
  }

  function addColumn(columnForAdd: number) {
    dispatch(addColumnAction(columnForAdd))
    setContextMenu(null)
    dispatch(setActiveCell(null))
    dispatch(setSelectedRange(null))
  }

  function deleteColumn(columnForDelete: number) {
    if (columnsCount === 1) {
      return
    }

    dispatch(deleteColumnAction(columnForDelete))
    setContextMenu(null)
    dispatch(setActiveCell(null))
    dispatch(setSelectedRange(null))
  }

  function handleCellClick(row: number, column: number, shiftKey: boolean) {
    const clickedCell = { row, column }

    if (shiftKey && activeCell) {
      dispatch(setSelectedRange({
        start: activeCell,
        end: clickedCell,
      }))
      return
    }

    dispatch(setActiveCell(clickedCell))
    dispatch(setSelectedRange({
      start: clickedCell,
      end: clickedCell,
    }))
  }

  function startEditing(row: number, column: number) {
    const cellId = getCellId(row, column)
    const clickedCell = { row, column }

    dispatch(setActiveCell(clickedCell))
    dispatch(setSelectedRange({
      start: clickedCell,
      end: clickedCell,
    }))
    setEditingCell(clickedCell)
    setEditingValue(cellValues[cellId]?.value ?? '')
  }

  function saveEditing(newValue: string) {
    if (!editingCell) {
      return
    }

    const cellId = getCellId(editingCell.row, editingCell.column)

    dispatch(
      setCellValue({
        id: cellId,
        data: {
          value: newValue,
          type: getCellType(newValue),
        },
      })
    )
    setEditingCell(null)
    setEditingValue('')
  }

  function cancelEditing() {
    setEditingCell(null)
    setEditingValue('')
  }

  return (
    <main className="app">
      <h1>Табличный процессор</h1>

      <div className="formula-panel">
        <div className="active-cell-name">{getActiveCellName()}</div>
        <input
          className="formula-input"
          value={getActiveCellValue()}
          placeholder="Содержимое ячейки"
          readOnly
        />
      </div>

      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(event) => event.stopPropagation()}
        >
          <button type="button" onClick={() => addRow(contextMenu.row)}>
            Вставить строку
          </button>
          <button type="button" onClick={() => deleteRow(contextMenu.row)}>
            Удалить строку
          </button>
          <button type="button" onClick={() => addColumn(contextMenu.column)}>
            Вставить столбец
          </button>
          <button type="button" onClick={() => deleteColumn(contextMenu.column)}>
            Удалить столбец
          </button>
        </div>
      )}

      <div className="table-wrapper">
        <div className="spreadsheet" style={{ minWidth: totalWidth }}>
          {/* Шапка с колонками (A, B, C...) */}
          <div className="table-row" style={{ display: 'flex', width: totalWidth }}>
            <div className="corner-cell" style={{ width: 50, minWidth: 50, flexShrink: 0 }}></div>
            {columns.map((column, columnIndex) => (
              <div
                key={column}
                className="column-header"
                style={{
                  width: getColumnWidth(columnIndex),
                  minWidth: getColumnWidth(columnIndex),
                  flexShrink: 0,
                }}
                onContextMenu={(event) => openContextMenu(event, 1, columnIndex)}
              >
                {column}
                <span
                  className="column-resizer"
                  onMouseDown={(event) => startColumnResize(event, columnIndex)}
                ></span>
              </div>
            ))}
          </div>

          {/* Тело таблицы */}
          {Array.from({ length: rowsCount }).map((_, rowIndex) => {
            const row = rowIndex + 1
            return (
              <div key={row} className="table-row" style={{ display: 'flex', width: totalWidth }}>
                <div
                  className="row-header"
                  style={{
                    width: 50,
                    minWidth: 50,
                    height: getRowHeight(row),
                    flexShrink: 0,
                  }}
                  onContextMenu={(event) => openContextMenu(event, row, 0)}
                >
                  {row}
                  <span
                    className="row-resizer"
                    onMouseDown={(event) => startRowResize(event, row)}
                  ></span>
                </div>
                {columns.map((column, columnIndex) => {
                  const cellId = getCellId(row, columnIndex)
                  const cellData = cellValues[cellId]
                  return (
                    <div
                      key={`${column}${row}`}
                      className={`cell ${isCellSelected(row, columnIndex) ? 'selected-cell' : ''} ${
                        isActiveCell(row, columnIndex) ? 'active-cell' : ''
                      } ${cellData ? `cell-${cellData.type}` : ''}`}
                      style={{
                        width: getColumnWidth(columnIndex),
                        minWidth: getColumnWidth(columnIndex),
                        height: getRowHeight(row),
                        flexShrink: 0,
                      }}
                      onClick={(event) => handleCellClick(row, columnIndex, event.shiftKey)}
                      onContextMenu={(event) => openContextMenu(event, row, columnIndex)}
                      onDoubleClick={() => startEditing(row, columnIndex)}
                    >
                      {isEditingCell(row, columnIndex) ? (
                        <input
                          autoFocus
                          className="cell-input"
                          value={editingValue}
                          onBlur={(event) => saveEditing(event.target.value)}
                          onChange={(event) => setEditingValue(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              event.stopPropagation()
                              saveEditing(event.currentTarget.value)
                            }
                            if (event.key === 'Escape') {
                              event.preventDefault()
                              event.stopPropagation()
                              cancelEditing()
                            }
                          }}
                        />
                      ) : (
                        <span className="cell-text">{getCellText(cellData, cellValues)}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}

export default App
