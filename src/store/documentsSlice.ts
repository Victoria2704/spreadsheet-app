import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit'
import { patchDocument } from '@/api/documents'
import type { CellData, DocumentMeta } from '@/types'

type LoadingStatus = 'idle' | 'loading' | 'success' | 'error'

export type DocumentsState = {
  items: DocumentMeta[]
  activeDocumentId: string | null
  loadingStatus: LoadingStatus
  error: string | null
}

export type SaveDocumentPayload = {
  document: DocumentMeta
  rowsCount: number
  columnsCount: number
  cells: Record<string, CellData>
  preview: string[][]
}

export function createEmptyPreview() {
  const preview: string[][] = []

  for (let row = 0; row < 3; row += 1) {
    const previewRow: string[] = []

    for (let column = 0; column < 3; column += 1) {
      previewRow.push('')
    }

    preview.push(previewRow)
  }

  return preview
}

function createCellsFromPreview(preview: string[][]) {
  const cells: Record<string, CellData> = {}

  preview.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      if (value.trim() === '') {
        return
      }

      cells[`${rowIndex + 1}-${columnIndex}`] = {
        value,
        type: 'string',
      }
    })
  })

  return cells
}

const shoppingPreview = [
  ['Молоко', 'Хлеб', 'Яйца'],
  ['Сыр', 'Чай', 'Сахар'],
  ['Рис', 'Соль', 'Кофе'],
]

const budgetPreview = [
  ['Доход', '120000', ''],
  ['Аренда', '35000', ''],
  ['Еда', '18000', ''],
]

const studyPreview = [
  ['React', 'Redux', 'Router'],
  ['HTML', 'CSS', 'TS'],
  ['Git', 'CI', 'Tests'],
]

const mockDocuments: DocumentMeta[] = [
  {
    id: 'doc-1',
    ownerId: 'user-1',
    title: 'Список покупок',
    createdAt: '2026-05-18T10:00:00.000Z',
    updatedAt: '2026-05-21T12:30:00.000Z',
    rowsCount: 100,
    columnsCount: 26,
    preview: shoppingPreview,
    cells: createCellsFromPreview(shoppingPreview),
  },
  {
    id: 'doc-2',
    ownerId: 'user-1',
    title: 'Бюджет на май',
    createdAt: '2026-05-19T08:15:00.000Z',
    updatedAt: '2026-05-22T09:45:00.000Z',
    rowsCount: 100,
    columnsCount: 26,
    preview: budgetPreview,
    cells: createCellsFromPreview(budgetPreview),
  },
  {
    id: 'doc-3',
    ownerId: 'user-1',
    title: 'Учёба',
    createdAt: '2026-05-20T14:00:00.000Z',
    updatedAt: '2026-05-22T17:10:00.000Z',
    rowsCount: 100,
    columnsCount: 26,
    preview: studyPreview,
    cells: createCellsFromPreview(studyPreview),
  },
]

const initialState: DocumentsState = {
  items: mockDocuments,
  activeDocumentId: null,
  loadingStatus: 'idle',
  error: null,
}

export const loadDocuments = createAsyncThunk(
  'documents/loadDocuments',
  async (userId: string) => {
    return mockDocuments.filter((document) => document.ownerId === userId)
  },
)

export const loadDocument = createAsyncThunk(
  'documents/loadDocument',
  async (documentId: string) => {
    return mockDocuments.find((document) => document.id === documentId) ?? null
  },
)

export const saveDocument = createAsyncThunk(
  'documents/saveDocument',
  async (payload: SaveDocumentPayload) => {
    const updatedAt = new Date().toISOString()
    const updatedDocument: DocumentMeta = {
      ...payload.document,
      rowsCount: payload.rowsCount,
      columnsCount: payload.columnsCount,
      cells: payload.cells,
      preview: payload.preview,
      updatedAt,
    }

    const isSaved = await patchDocument(payload.document.id, {
      rowsCount: payload.rowsCount,
      columnsCount: payload.columnsCount,
      cells: payload.cells,
      preview: payload.preview,
      updatedAt,
    })

    if (!isSaved) {
      throw new Error('Ошибка сохранения')
    }

    return updatedDocument
  },
)

export const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    setActiveDocumentId: (state, action: PayloadAction<string | null>) => {
      state.activeDocumentId = action.payload
    },
    createDocument: (state, action: PayloadAction<DocumentMeta>) => {
      state.items.push(action.payload)
    },
    updateDocument: (state, action: PayloadAction<DocumentMeta>) => {
      const index = state.items.findIndex(
        (document) => document.id === action.payload.id,
      )

      if (index !== -1) {
        state.items[index] = action.payload
      }
    },
    deleteDocument: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(
        (document) => document.id !== action.payload,
      )

      if (state.activeDocumentId === action.payload) {
        state.activeDocumentId = null
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDocuments.pending, (state) => {
        state.loadingStatus = 'loading'
        state.error = null
      })
      .addCase(loadDocuments.fulfilled, (state, action) => {
        state.items = action.payload
        state.loadingStatus = 'success'
      })
      .addCase(loadDocuments.rejected, (state) => {
        state.loadingStatus = 'error'
        state.error = 'Не удалось загрузить документы'
      })
      .addCase(loadDocument.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.items.findIndex(
            (document) => document.id === action.payload?.id,
          )

          if (index === -1) {
            state.items.push(action.payload)
          }
        }
      })
      .addCase(saveDocument.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (document) => document.id === action.payload.id,
        )

        if (index !== -1) {
          state.items[index] = action.payload
        }
      })
  },
})

export const {
  setActiveDocumentId,
  createDocument,
  updateDocument,
  deleteDocument,
} = documentsSlice.actions

export default documentsSlice.reducer
