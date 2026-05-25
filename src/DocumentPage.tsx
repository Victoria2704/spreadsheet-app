import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  addColumn as addColumnAction,
  addRow as addRowAction,
  deleteColumn as deleteColumnAction,
  deleteRow as deleteRowAction,
  loadDocument,
  redo,
  setActiveCell,
  setCellValue,
  setColumnWidth,
  setRowHeight,
  setSelectedRange,
  undo,
} from '@/store/spreadsheetSlice'
import { saveDocument } from '@/store/documentsSlice'
import {
  buildPreview,
  getCellId,
  getCellText,
  getCellType,
  getColumnName,
  serializeCellsToCsv,
} from '@/tableHelpers'
import type { CellData, CellPosition, ContextMenu, DocumentMeta } from '@/types'

const DEFAULT_COLUMN_WIDTH = 100
const DEFAULT_ROW_HEIGHT = 28
const HEADER_HEIGHT = 32
const ROWS_BUFFER = 6

type DocumentPageProps = {
  document: DocumentMeta
  onBack: () => void
}

function DocumentPage({ document, onBack }: DocumentPageProps) {
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
  const saveStatus = useAppSelector((state) => state.ui.saveStatus)
  const hasUnsavedChanges = useAppSelector(
    (state) => state.ui.hasUnsavedChanges,
  )

  const [editingCell, setEditingCell] = useState<CellPosition | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [tableHeight, setTableHeight] = useState(600)
  const tableWrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    dispatch(
      loadDocument({
        rowsCount: document.rowsCount,
        columnsCount: document.columnsCount,
        cellValues: document.cells,
      }),
    )
  }, [dispatch, document])

  const saveDocumentNow = useCallback(
    (nextCellValues: Record<string, CellData>) => {
      dispatch(
        saveDocument({
          document,
          rowsCount,
          columnsCount,
          cells: nextCellValues,
          preview: buildPreview(nextCellValues),
        }),
      )
    },
    [columnsCount, dispatch, document, rowsCount],
  )

  const saveEditing = useCallback(
    (newValue: string) => {
      if (!editingCell) {
        return cellValues
      }

      const cellId = getCellId(editingCell.row, editingCell.column)
      const nextCellValues = {
        ...cellValues,
        [cellId]: {
          value: newValue,
          type: getCellType(newValue),
        },
      }

      dispatch(
        setCellValue({
          id: cellId,
          data: nextCellValues[cellId],
        }),
      )
      setEditingCell(null)
      setEditingValue('')

      return nextCellValues
    },
    [cellValues, dispatch, editingCell],
  )

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()

        if (editingCell) {
          saveDocumentNow(saveEditing(editingValue))
          return
        }

        saveDocumentNow(cellValues)
        return
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()

        if (event.shiftKey) {
          dispatch(redo())
        } else {
          dispatch(undo())
        }
        return
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        dispatch(redo())
        return
      }

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
  }, [
    activeCell,
    cellValues,
    dispatch,
    editingCell,
    editingValue,
    saveDocumentNow,
    saveEditing,
  ])

  useEffect(() => {
    function closeContextMenu() {
      setContextMenu(null)
    }

    window.addEventListener('click', closeContextMenu)

    return () => {
      window.removeEventListener('click', closeContextMenu)
    }
  }, [])

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (
        !hasUnsavedChanges &&
        saveStatus !== 'saving' &&
        saveStatus !== 'error'
      ) {
        return
      }

      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges, saveStatus])

  useEffect(() => {
    if (tableWrapperRef.current) {
      setTableHeight(tableWrapperRef.current.clientHeight)
    }
  }, [])

  const columns = useMemo(
    () =>
      Array.from({ length: columnsCount }, (_, index) => getColumnName(index)),
    [columnsCount],
  )

  const totalWidth = useMemo(() => {
    let width = 50

    for (let i = 0; i < columnsCount; i += 1) {
      width += columnWidths[i] ?? DEFAULT_COLUMN_WIDTH
    }

    return width
  }, [columnsCount, columnWidths])

  const { rowsHeight, rowTops } = useMemo(() => {
    let height = 0
    const tops: Record<number, number> = {}

    for (let row = 1; row <= rowsCount; row += 1) {
      tops[row] = height
      height += rowHeights[row] ?? DEFAULT_ROW_HEIGHT
    }

    return { rowsHeight: height, rowTops: tops }
  }, [rowsCount, rowHeights])

  const visibleRows = useMemo(() => {
    const bodyScrollTop = Math.max(0, scrollTop - HEADER_HEIGHT)
    let firstRow = 1

    while (
      firstRow < rowsCount &&
      rowTops[firstRow] + (rowHeights[firstRow] ?? DEFAULT_ROW_HEIGHT) <
        bodyScrollTop
    ) {
      firstRow += 1
    }

    firstRow = Math.max(1, firstRow - ROWS_BUFFER)

    let lastRow = firstRow

    while (
      lastRow < rowsCount &&
      rowTops[lastRow] < bodyScrollTop + tableHeight
    ) {
      lastRow += 1
    }

    lastRow = Math.min(rowsCount, lastRow + ROWS_BUFFER)

    return Array.from(
      { length: lastRow - firstRow + 1 },
      (_, index) => firstRow + index,
    )
  }, [rowsCount, rowTops, scrollTop, tableHeight, rowHeights])

  const topSpace = useMemo(() => {
    if (visibleRows.length === 0) {
      return 0
    }

    return rowTops[visibleRows[0]] ?? 0
  }, [rowTops, visibleRows])

  function getColumnWidth(column: number) {
    return columnWidths[column] ?? DEFAULT_COLUMN_WIDTH
  }

  function getRowHeight(row: number) {
    return rowHeights[row] ?? DEFAULT_ROW_HEIGHT
  }

  function isCellSelected(row: number, column: number) {
    if (!selectedRange) {
      return false
    }

    const startRow = Math.min(selectedRange.start.row, selectedRange.end.row)
    const endRow = Math.max(selectedRange.start.row, selectedRange.end.row)
    const startColumn = Math.min(
      selectedRange.start.column,
      selectedRange.end.column,
    )
    const endColumn = Math.max(
      selectedRange.start.column,
      selectedRange.end.column,
    )

    return (
      row >= startRow &&
      row <= endRow &&
      column >= startColumn &&
      column <= endColumn
    )
  }

  function isActiveCell(row: number, column: number) {
    return activeCell?.row === row && activeCell.column === column
  }

  function isEditingCell(row: number, column: number) {
    return editingCell?.row === row && editingCell.column === column
  }

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

  function openContextMenu(
    event: ReactMouseEvent,
    row: number,
    column: number,
  ) {
    event.preventDefault()

    const clickedCell = { row, column }

    dispatch(setActiveCell(clickedCell))
    dispatch(
      setSelectedRange({
        start: clickedCell,
        end: clickedCell,
      }),
    )
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
      dispatch(
        setSelectedRange({
          start: activeCell,
          end: clickedCell,
        }),
      )
      return
    }

    dispatch(setActiveCell(clickedCell))
    dispatch(
      setSelectedRange({
        start: clickedCell,
        end: clickedCell,
      }),
    )
  }

  function startEditing(row: number, column: number) {
    const cellId = getCellId(row, column)
    const clickedCell = { row, column }

    dispatch(setActiveCell(clickedCell))
    dispatch(
      setSelectedRange({
        start: clickedCell,
        end: clickedCell,
      }),
    )
    setEditingCell(clickedCell)
    setEditingValue(cellValues[cellId]?.value ?? '')
  }

  function cancelEditing() {
    setEditingCell(null)
    setEditingValue('')
  }

  function handleExportCsv() {
    const csvText = serializeCellsToCsv(cellValues, rowsCount, columnsCount)
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')

    link.href = url
    link.download = `${document.title}.csv`
    link.click()

    URL.revokeObjectURL(url)
  }

  function handleExportJson() {
    const jsonText = JSON.stringify(
      {
        id: document.id,
        title: document.title,
        rowsCount,
        columnsCount,
        cells: cellValues,
        columnWidths,
        rowHeights,
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    )
    const blob = new Blob([jsonText], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')

    link.href = url
    link.download = `${document.title}.json`
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <main className="document-page">
      <header className="document-topbar">
        <div>
          <p className="dashboard-label">Документ</p>
          <h1 className="document-page-title">{document.title}</h1>
        </div>

        <div className="document-topbar-actions">
          <span className="save-status">
            {saveStatus === 'saving'
              ? 'Сохранение...'
              : saveStatus === 'error'
                ? 'Ошибка сохранения'
                : 'Сохранено'}
          </span>
          <button
            type="button"
            className="secondary-button"
            onClick={handleExportCsv}
          >
            Экспорт CSV
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={handleExportJson}
          >
            Экспорт JSON
          </button>
          <button type="button" className="secondary-button" onClick={onBack}>
            Назад
          </button>
        </div>
      </header>

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
          <button
            type="button"
            onClick={() => deleteColumn(contextMenu.column)}
          >
            Удалить столбец
          </button>
        </div>
      )}

      <div
        ref={tableWrapperRef}
        className="table-wrapper"
        onScroll={(event) => {
          setScrollTop(event.currentTarget.scrollTop)
          setTableHeight(event.currentTarget.clientHeight)
        }}
      >
        <div className="spreadsheet" style={{ minWidth: totalWidth }}>
          <div
            className="table-row"
            style={{ display: 'flex', width: totalWidth }}
          >
            <div
              className="corner-cell"
              style={{ width: 50, minWidth: 50, flexShrink: 0 }}
            />
            {columns.map((column, columnIndex) => (
              <div
                key={column}
                className="column-header"
                style={{
                  width: getColumnWidth(columnIndex),
                  minWidth: getColumnWidth(columnIndex),
                  flexShrink: 0,
                }}
                onContextMenu={(event) =>
                  openContextMenu(event, 1, columnIndex)
                }
              >
                {column}
                <span
                  className="column-resizer"
                  onMouseDown={(event) => startColumnResize(event, columnIndex)}
                />
              </div>
            ))}
          </div>

          <div
            style={{
              height: rowsHeight,
              position: 'relative',
              width: totalWidth,
            }}
          >
            <div style={{ transform: `translateY(${topSpace}px)` }}>
              {visibleRows.map((row) => (
                <div
                  key={row}
                  className="table-row"
                  style={{ display: 'flex', width: totalWidth }}
                >
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
                    />
                  </div>
                  {columns.map((column, columnIndex) => {
                    const cellId = getCellId(row, columnIndex)
                    const cellData = cellValues[cellId]

                    return (
                      <div
                        key={`${column}${row}`}
                        className={`cell ${
                          isCellSelected(row, columnIndex)
                            ? 'selected-cell'
                            : ''
                        } ${
                          isActiveCell(row, columnIndex) ? 'active-cell' : ''
                        } ${cellData ? `cell-${cellData.type}` : ''}`}
                        style={{
                          width: getColumnWidth(columnIndex),
                          minWidth: getColumnWidth(columnIndex),
                          height: getRowHeight(row),
                          flexShrink: 0,
                        }}
                        onClick={(event) =>
                          handleCellClick(row, columnIndex, event.shiftKey)
                        }
                        onContextMenu={(event) =>
                          openContextMenu(event, row, columnIndex)
                        }
                        onDoubleClick={() => startEditing(row, columnIndex)}
                      >
                        {isEditingCell(row, columnIndex) ? (
                          <input
                            autoFocus
                            className="cell-input"
                            value={editingValue}
                            onBlur={(event) => saveEditing(event.target.value)}
                            onChange={(event) =>
                              setEditingValue(event.target.value)
                            }
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
                          <span className="cell-text">
                            {getCellText(cellData, cellValues)}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default DocumentPage
