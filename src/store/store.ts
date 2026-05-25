import { configureStore } from '@reduxjs/toolkit'
import spreadsheetReducer from '@/store/spreadsheetSlice'
import documentsReducer from '@/store/documentsSlice'
import uiReducer from '@/store/uiSlice'
import authReducer from '@/store/authSlice'
import { autosaveMiddleware } from '@/store/autosaveMiddleware'

export const store = configureStore({
  reducer: {
    spreadsheet: spreadsheetReducer,
    documents: documentsReducer,
    ui: uiReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(autosaveMiddleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
