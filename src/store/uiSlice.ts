import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { saveDocument } from '@/store/documentsSlice'
import type { SaveStatus } from '@/types'

export type UiState = {
  isCreateModalOpen: boolean
  saveStatus: SaveStatus
  hasUnsavedChanges: boolean
  notification: string | null
}

const initialState: UiState = {
  isCreateModalOpen: false,
  saveStatus: 'saved',
  hasUnsavedChanges: false,
  notification: null,
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openCreateModal: (state) => {
      state.isCreateModalOpen = true
    },
    closeCreateModal: (state) => {
      state.isCreateModalOpen = false
    },
    setSaveStatus: (state, action: PayloadAction<SaveStatus>) => {
      state.saveStatus = action.payload
    },
    setHasUnsavedChanges: (state, action: PayloadAction<boolean>) => {
      state.hasUnsavedChanges = action.payload
    },
    setNotification: (state, action: PayloadAction<string | null>) => {
      state.notification = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveDocument.pending, (state) => {
        state.saveStatus = 'saving'
      })
      .addCase(saveDocument.fulfilled, (state) => {
        state.saveStatus = 'saved'
        state.hasUnsavedChanges = false
      })
      .addCase(saveDocument.rejected, (state) => {
        state.saveStatus = 'error'
        state.hasUnsavedChanges = true
      })
  },
})

export const {
  openCreateModal,
  closeCreateModal,
  setSaveStatus,
  setHasUnsavedChanges,
  setNotification,
} = uiSlice.actions

export default uiSlice.reducer
