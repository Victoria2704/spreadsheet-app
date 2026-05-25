import { describe, expect, it } from 'vitest'
import uiReducer, {
  closeCreateModal,
  openCreateModal,
  setHasUnsavedChanges,
  setSaveStatus,
} from '@/store/uiSlice'

describe('uiSlice', () => {
  it('открывает и закрывает модальное окно создания', () => {
    let state = uiReducer(undefined, openCreateModal())

    expect(state.isCreateModalOpen).toBe(true)

    state = uiReducer(state, closeCreateModal())
    expect(state.isCreateModalOpen).toBe(false)
  })

  it('хранит статус сохранения', () => {
    let state = uiReducer(undefined, setSaveStatus('saving'))

    expect(state.saveStatus).toBe('saving')

    state = uiReducer(state, setHasUnsavedChanges(true))
    expect(state.hasUnsavedChanges).toBe(true)
  })
})
