import { describe, expect, it } from 'vitest'
import documentsReducer, {
  createDocument,
  deleteDocument,
  setActiveDocumentId,
  updateDocument,
} from '@/store/documentsSlice'
import type { DocumentMeta } from '@/types'

function makeDocument(id: string): DocumentMeta {
  return {
    id,
    ownerId: 'user-1',
    title: 'Документ',
    createdAt: '2026-05-25T10:00:00.000Z',
    updatedAt: '2026-05-25T10:00:00.000Z',
    rowsCount: 10,
    columnsCount: 5,
    preview: [
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ],
    cells: {},
  }
}

describe('documentsSlice', () => {
  it('создает и переименовывает документ', () => {
    let state = documentsReducer(undefined, createDocument(makeDocument('new')))
    const createdDocument = state.items.find(
      (document) => document.id === 'new',
    )

    expect(createdDocument?.title).toBe('Документ')

    state = documentsReducer(
      state,
      updateDocument({
        ...makeDocument('new'),
        title: 'Новое название',
      }),
    )

    expect(state.items.find((document) => document.id === 'new')?.title).toBe(
      'Новое название',
    )
  })

  it('удаляет активный документ', () => {
    let state = documentsReducer(undefined, createDocument(makeDocument('new')))
    state = documentsReducer(state, setActiveDocumentId('new'))
    state = documentsReducer(state, deleteDocument('new'))

    expect(state.activeDocumentId).toBeNull()
    expect(
      state.items.find((document) => document.id === 'new'),
    ).toBeUndefined()
  })
})
