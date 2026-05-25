import { createSlice } from '@reduxjs/toolkit'
import type { User } from '@/types'

export type AuthState = {
  user: User
  isAuthenticated: boolean
}

const initialState: AuthState = {
  user: {
    id: 'user-1',
    name: 'Виктория',
    email: 'victoria@example.com',
    registeredAt: '2026-05-18T10:00:00.000Z',
  },
  isAuthenticated: true,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false
    },
  },
})

export const { logout } = authSlice.actions

export default authSlice.reducer
