import { describe, expect, it } from 'vitest'
import authReducer, {
  login,
  logout,
  refreshAccessToken,
  register,
} from '@/store/authSlice'

describe('authSlice', () => {
  it('входит по тестовому пользователю', () => {
    const state = authReducer(
      undefined,
      login({
        email: 'cuff84cuff@gmail.com',
        password: '12345678',
      }),
    )

    expect(state.isAuthenticated).toBe(true)
    expect(state.user?.id).toBe('user-1')
    expect(state.accessToken).toContain('access-user-1')
    expect(state.refreshToken).toBe('refresh-user-1')
  })

  it('показывает ошибку при неправильном пароле', () => {
    const state = authReducer(
      undefined,
      login({
        email: 'cuff84cuff@gmail.com',
        password: 'wrong-password',
      }),
    )

    expect(state.isAuthenticated).toBe(false)
    expect(state.error).toBe('Неверный email или пароль')
  })

  it('регистрирует нового пользователя', () => {
    const state = authReducer(
      undefined,
      register({
        name: 'Новый пользователь',
        email: 'new-user',
        password: '12345678',
      }),
    )

    expect(state.isAuthenticated).toBe(true)
    expect(state.user?.email).toBe('new-user')
  })

  it('обновляет access token через refresh token', () => {
    let state = authReducer(
      undefined,
      login({
        email: 'cuff84cuff@gmail.com',
        password: '12345678',
      }),
    )
    const oldToken = state.accessToken

    state = authReducer(state, refreshAccessToken())

    expect(state.isAuthenticated).toBe(true)
    expect(state.accessToken).not.toBeNull()
    expect(state.accessToken).toContain('access-user-1')
    expect(state.accessToken).not.toBe(oldToken)
  })

  it('делает выход пользователя', () => {
    let state = authReducer(
      undefined,
      login({
        email: 'cuff84cuff@gmail.com',
        password: '12345678',
      }),
    )

    state = authReducer(state, logout())

    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })
})
