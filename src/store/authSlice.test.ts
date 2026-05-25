import { describe, expect, it } from 'vitest'
import authReducer, { logout } from '@/store/authSlice'

describe('authSlice', () => {
  it('хранит mock-пользователя', () => {
    const state = authReducer(undefined, { type: 'unknown' })

    expect(state.user.id).toBe('user-1')
    expect(state.isAuthenticated).toBe(true)
  })

  it('делает выход пользователя', () => {
    const state = authReducer(undefined, logout())

    expect(state.isAuthenticated).toBe(false)
  })
})
