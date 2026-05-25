import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { DocumentMeta } from '@/types'

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

const initialState: DocumentMeta[] = [
  {
    id: 'doc-1',
    ownerId: 'user-1',
    title: 'Список покупок',
    createdAt: '2026-05-18T10:00:00.000Z',
    updatedAt: '2026-05-21T12:30:00.000Z',
    rowsCount: 100,
    columnsCount: 26,
    preview: [
      ['Молоко', 'Хлеб', 'Яйца'],
      ['Сыр', 'Чай', 'Сахар'],
      ['Рис', 'Соль', 'Кофе'],
    ],
    cells: {},
  },
  {
    id: 'doc-2',
    ownerId: 'user-1',
    title: 'Бюджет на май',
    createdAt: '2026-05-19T08:15:00.000Z',
    updatedAt: '2026-05-22T09:45:00.000Z',
    rowsCount: 100,
    columnsCount: 26,
    preview: [
      ['Доход', '120000', ''],
      ['Аренда', '35000', ''],
      ['Еда', '18000', ''],
    ],
    cells: {},
  },
  {
    id: 'doc-3',
    ownerId: 'user-1',
    title: 'Учёба',
    createdAt: '2026-05-20T14:00:00.000Z',
    updatedAt: '2026-05-22T17:10:00.000Z',
    rowsCount: 100,
    columnsCount: 26,
    preview: [
      ['React', 'Redux', 'Router'],
      ['HTML', 'CSS', 'TS'],
      ['Git', 'CI', 'Tests'],
    ],
    cells: {},
  },
]

export const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    createDocument: (state, action: PayloadAction<DocumentMeta>) => {
      state.push(action.payload)
    },
    updateDocument: (state, action: PayloadAction<DocumentMeta>) => {
      const index = state.findIndex(
        (document) => document.id === action.payload.id,
      )

      if (index !== -1) {
        state[index] = action.payload
      }
    },
    deleteDocument: (state, action: PayloadAction<string>) => {
      return state.filter((document) => document.id !== action.payload)
    },
  },
})

export const { createDocument, updateDocument, deleteDocument } =
  documentsSlice.actions

export default documentsSlice.reducer
