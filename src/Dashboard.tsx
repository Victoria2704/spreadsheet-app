import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  createDocument,
  createEmptyPreview,
  deleteDocument,
  updateDocument,
} from '@/store/documentsSlice'
import { getCellId, getCellType, parseCsvText } from '@/tableHelpers'
import type { CellData, DocumentMeta } from '@/types'

type DashboardProps = {
  onOpenDocument: (documentId: string) => void
}

const CURRENT_USER_ID = 'user-1'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('ru-RU')
}

function DocumentPreview({ document }: { document: DocumentMeta }) {
  return (
    <div className="document-preview" aria-label={`Preview ${document.title}`}>
      {document.preview.map((row, rowIndex) =>
        row.map((cell, cellIndex) => (
          <span
            key={`${rowIndex}-${cellIndex}-${cell}`}
            className="document-preview-cell"
          >
            {cell}
          </span>
        )),
      )}
    </div>
  )
}

function Dashboard({ onOpenDocument }: DashboardProps) {
  const dispatch = useAppDispatch()
  const documents = useAppSelector((state) =>
    state.documents.filter((document) => document.ownerId === CURRENT_USER_ID),
  )
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const [title, setTitle] = useState('')
  const [rowsCount, setRowsCount] = useState(100)
  const [columnsCount, setColumnsCount] = useState(26)
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(
    null,
  )
  const [editingTitle, setEditingTitle] = useState('')

  function openCreateModal() {
    setIsCreateOpen(true)
  }

  function closeCreateModal() {
    setIsCreateOpen(false)
    setTitle('')
    setRowsCount(100)
    setColumnsCount(26)
  }

  function startRename(document: DocumentMeta) {
    setEditingDocumentId(document.id)
    setEditingTitle(document.title)
  }

  function cancelRename() {
    setEditingDocumentId(null)
    setEditingTitle('')
  }

  function saveRename(document: DocumentMeta) {
    const nextTitle = editingTitle.trim() || document.title

    dispatch(
      updateDocument({
        ...document,
        title: nextTitle,
        updatedAt: new Date().toISOString(),
      }),
    )
    cancelRename()
  }

  function handleDeleteDocument(document: DocumentMeta) {
    const isConfirmed = window.confirm(`Удалить документ "${document.title}"?`)

    if (!isConfirmed) {
      return
    }

    dispatch(deleteDocument(document.id))
  }

  function handleDuplicateDocument(document: DocumentMeta) {
    const now = new Date().toISOString()

    dispatch(
      createDocument({
        ...document,
        id: `doc-${Date.now()}`,
        ownerId: CURRENT_USER_ID,
        title: `Копия ${document.title}`,
        createdAt: now,
        updatedAt: now,
        preview: document.preview.map((row) => [...row]),
        cells: { ...document.cells },
      }),
    )
  }

  function handleCreateDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const now = new Date().toISOString()

    dispatch(
      createDocument({
        id: `doc-${Date.now()}`,
        ownerId: CURRENT_USER_ID,
        title: title.trim() || 'Новый документ',
        createdAt: now,
        updatedAt: now,
        rowsCount,
        columnsCount,
        preview: createEmptyPreview(),
        cells: {},
      }),
    )

    closeCreateModal()
  }

  function openImportPicker() {
    importInputRef.current?.click()
  }

  async function handleImportCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const text = await file.text()
    const rows = parseCsvText(text)
    const now = new Date().toISOString()
    const cells: Record<string, CellData> = {}
    let maxColumns = 1

    rows.forEach((row, rowIndex) => {
      maxColumns = Math.max(maxColumns, row.length)

      row.forEach((value, columnIndex) => {
        if (value.trim() === '') {
          return
        }

        cells[getCellId(rowIndex + 1, columnIndex)] = {
          value,
          type: getCellType(value),
        }
      })
    })

    const preview = createEmptyPreview()

    rows.slice(0, 3).forEach((row, rowIndex) => {
      row.slice(0, 3).forEach((value, columnIndex) => {
        preview[rowIndex][columnIndex] = value
      })
    })

    const importedDocumentId = `doc-${Date.now()}`

    dispatch(
      createDocument({
        id: importedDocumentId,
        ownerId: CURRENT_USER_ID,
        title: file.name.replace(/\.csv$/i, '') || 'Импортированный документ',
        createdAt: now,
        updatedAt: now,
        rowsCount: Math.max(rows.length, 1),
        columnsCount: maxColumns,
        preview,
        cells,
      }),
    )

    event.target.value = ''
    onOpenDocument(importedDocumentId)
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-label">Мои документы</p>
          <h1 className="dashboard-title">Таблицы</h1>
        </div>
        <div className="dashboard-actions">
          <p className="dashboard-note">
            Здесь пока просто список документов с датами и маленьким превью.
          </p>
          <div className="dashboard-buttons">
            <button
              type="button"
              className="secondary-button"
              onClick={openImportPicker}
            >
              Импорт CSV
            </button>
            <button
              type="button"
              className="create-button"
              onClick={openCreateModal}
            >
              Новый документ
            </button>
          </div>
        </div>
      </header>

      <section className="document-list">
        {documents.map((document) => (
          <article className="document-card" key={document.id}>
            <div className="document-main">
              <div>
                {editingDocumentId === document.id ? (
                  <input
                    autoFocus
                    className="rename-input"
                    value={editingTitle}
                    onChange={(event) => setEditingTitle(event.target.value)}
                    onBlur={() => saveRename(document)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        saveRename(document)
                      }

                      if (event.key === 'Escape') {
                        event.preventDefault()
                        cancelRename()
                      }
                    }}
                  />
                ) : (
                  <h2
                    className="document-title"
                    onDoubleClick={() => startRename(document)}
                  >
                    {document.title}
                  </h2>
                )}
                <p className="document-meta">
                  Создан: {formatDate(document.createdAt)}
                </p>
                <p className="document-meta">
                  Изменён: {formatDate(document.updatedAt)}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={() => onOpenDocument(document.id)}
            >
              Открыть
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => startRename(document)}
            >
              Переименовать
            </button>

            <div className="document-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => handleDuplicateDocument(document)}
              >
                Дублировать
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={() => handleDeleteDocument(document)}
              >
                Удалить
              </button>
            </div>

            <DocumentPreview document={document} />
          </article>
        ))}
      </section>

      {isCreateOpen && (
        <div className="modal-backdrop" onClick={closeCreateModal}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h2 className="modal-title">Новый документ</h2>

            <form className="create-form" onSubmit={handleCreateDocument}>
              <label className="field">
                <span>Название</span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Например, Таблица продаж"
                />
              </label>

              <div className="size-grid">
                <label className="field">
                  <span>Строки</span>
                  <input
                    type="number"
                    min="1"
                    value={rowsCount}
                    onChange={(event) =>
                      setRowsCount(Number(event.target.value) || 1)
                    }
                  />
                </label>

                <label className="field">
                  <span>Столбцы</span>
                  <input
                    type="number"
                    min="1"
                    value={columnsCount}
                    onChange={(event) =>
                      setColumnsCount(Number(event.target.value) || 1)
                    }
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeCreateModal}
                >
                  Отмена
                </button>
                <button type="submit" className="primary-button">
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <input
        ref={importInputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={handleImportCsv}
      />
    </main>
  )
}

export default Dashboard
