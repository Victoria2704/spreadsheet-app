import { configureStore } from '@reduxjs/toolkit'
import spreadsheetReducer from '@/store/spreadsheetSlice'
import documentsReducer from '@/store/documentsSlice'

export const store = configureStore({
  reducer: {
    spreadsheet: spreadsheetReducer,
    documents: documentsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
