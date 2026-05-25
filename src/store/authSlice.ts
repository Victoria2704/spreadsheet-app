import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '@/types'

type Account = User & {
  password: string
}

export type AuthState = {
  user: User | null
  accounts: Account[]
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  accessTokenExpiresAt: number | null
  error: string | null
}

type LoginPayload = {
  email: string
  password: string
}

type RegisterPayload = {
  name: string
  email: string
  password: string
}

const REFRESH_TOKEN_KEY = 'spreadsheet-refresh-token'
const ACCOUNTS_KEY = 'spreadsheet-accounts'
let tokenNumber = 0

function getSavedRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

function getSavedAccounts(defaultAccounts: Account[]) {
  try {
    const text = localStorage.getItem(ACCOUNTS_KEY)

    if (!text) {
      return defaultAccounts
    }

    const savedAccounts = JSON.parse(text) as Account[]
    const defaultIds = defaultAccounts.map((account) => account.id)
    const customAccounts = savedAccounts.filter(
      (account) => !defaultIds.includes(account.id),
    )

    return [...customAccounts, ...defaultAccounts]
  } catch {
    return defaultAccounts
  }
}

function makeAccessToken(userId: string) {
  tokenNumber += 1
  return `access-${userId}-${tokenNumber}`
}

function makeRefreshToken(userId: string) {
  return `refresh-${userId}`
}

function getUserIdFromRefreshToken(token: string | null) {
  return token?.replace('refresh-', '') ?? null
}

function withoutPassword(account: Account): User {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    registeredAt: account.registeredAt,
  }
}

const defaultAccounts: Account[] = [
  {
    id: 'user-1',
    name: 'vika',
    email: 'cuff84cuff@gmail.com',
    password: '12345678',
    registeredAt: '2026-05-18T10:00:00.000Z',
  },
  {
    id: 'user-2',
    name: 'Другой пользователь',
    email: 'other',
    password: '12345678',
    registeredAt: '2026-05-19T10:00:00.000Z',
  },
]

const accounts = getSavedAccounts(defaultAccounts)
const savedRefreshToken = getSavedRefreshToken()
const savedUserId = getUserIdFromRefreshToken(savedRefreshToken)
const savedAccount = accounts.find((account) => account.id === savedUserId)

const initialState: AuthState = {
  user: savedAccount ? withoutPassword(savedAccount) : null,
  accounts,
  isAuthenticated: Boolean(savedAccount),
  accessToken: savedAccount ? makeAccessToken(savedAccount.id) : null,
  refreshToken: savedAccount ? savedRefreshToken : null,
  accessTokenExpiresAt: savedAccount ? Date.now() + 15 * 60 * 1000 : null,
  error: null,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<LoginPayload>) => {
      const account = state.accounts.find(
        (item) =>
          item.email === action.payload.email &&
          item.password === action.payload.password,
      )

      if (!account) {
        state.error = 'Неверный email или пароль'
        return
      }

      state.user = withoutPassword(account)
      state.isAuthenticated = true
      state.accessToken = makeAccessToken(account.id)
      state.refreshToken = makeRefreshToken(account.id)
      state.accessTokenExpiresAt = Date.now() + 15 * 60 * 1000
      state.error = null
    },
    register: (state, action: PayloadAction<RegisterPayload>) => {
      const emailExists = state.accounts.some(
        (account) => account.email === action.payload.email,
      )

      if (emailExists) {
        state.error = 'Такой email уже зарегистрирован'
        return
      }

      const now = new Date().toISOString()
      const account: Account = {
        id: `user-${Date.now()}`,
        name: action.payload.name,
        email: action.payload.email,
        password: action.payload.password,
        registeredAt: now,
      }

      state.accounts.push(account)
      state.user = withoutPassword(account)
      state.isAuthenticated = true
      state.accessToken = makeAccessToken(account.id)
      state.refreshToken = makeRefreshToken(account.id)
      state.accessTokenExpiresAt = Date.now() + 15 * 60 * 1000
      state.error = null
    },
    refreshAccessToken: (state) => {
      const userId = getUserIdFromRefreshToken(state.refreshToken)
      const account = state.accounts.find((item) => item.id === userId)

      if (!account) {
        state.user = null
        state.isAuthenticated = false
        state.accessToken = null
        state.refreshToken = null
        state.accessTokenExpiresAt = null
        return
      }

      state.user = withoutPassword(account)
      state.isAuthenticated = true
      state.accessToken = makeAccessToken(account.id)
      state.accessTokenExpiresAt = Date.now() + 15 * 60 * 1000
    },
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.accessToken = null
      state.refreshToken = null
      state.accessTokenExpiresAt = null
      state.error = null
    },
    clearAuthError: (state) => {
      state.error = null
    },
  },
})

export const { login, register, refreshAccessToken, logout, clearAuthError } =
  authSlice.actions
export { ACCOUNTS_KEY, REFRESH_TOKEN_KEY }

export default authSlice.reducer
