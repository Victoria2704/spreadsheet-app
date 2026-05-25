import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  createBrowserRouter,
  Navigate,
  NavLink,
  Outlet,
  RouterProvider,
  useBlocker,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import Dashboard from '@/Dashboard'
import DocumentPage from '@/DocumentPage'
import {
  ACCOUNTS_KEY,
  changePassword,
  clearAuthError,
  login,
  logout,
  refreshAccessToken,
  register,
  REFRESH_TOKEN_KEY,
  updateUserName,
} from '@/store/authSlice'
import { DOCUMENTS_KEY, setActiveDocumentId } from '@/store/documentsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

function ProtectedRoute() {
  const location = useLocation()
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}

function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const documents = useAppSelector((state) => state.documents.items)
  const documentId = location.pathname.startsWith('/documents/')
    ? location.pathname.split('/')[2]
    : null
  const document = documents.find((item) => item.id === documentId)

  function handleLogout() {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <b>Spreadsheet</b>
        <div className="header-user">
          <span>{user?.email}</span>
          <button type="button" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </header>

      <div className="app-body">
        <aside className="app-sidebar">
          <NavLink to="/dashboard">Мои документы</NavLink>
          <NavLink to="/profile">Профиль</NavLink>
        </aside>

        <div className="app-content">
          <div className="breadcrumbs">
            <NavLink to="/dashboard">Мои документы</NavLink>
            {document && <span> / {document.title}</span>}
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  )
}

function LeaveDocumentBlocker() {
  const hasUnsavedChanges = useAppSelector(
    (state) => state.ui.hasUnsavedChanges,
  )
  const saveStatus = useAppSelector((state) => state.ui.saveStatus)
  const shouldBlock =
    hasUnsavedChanges || saveStatus === 'saving' || saveStatus === 'error'
  const blocker = useBlocker(shouldBlock)

  useEffect(() => {
    if (blocker.state !== 'blocked') {
      return
    }

    const canLeave = window.confirm(
      'Есть несохранённые изменения. Всё равно уйти?',
    )

    if (canLeave) {
      blocker.proceed()
    } else {
      blocker.reset()
    }
  }, [blocker])

  return null
}

function SpreadsheetPage() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const document = useAppSelector((state) =>
    state.documents.items.find((item) => item.id === documentId),
  )

  useEffect(() => {
    dispatch(setActiveDocumentId(document?.id ?? null))

    return () => {
      dispatch(setActiveDocumentId(null))
    }
  }, [dispatch, document?.id])

  if (!document) {
    return <NotFoundPage text="Такого документа нет" />
  }

  if (document.ownerId !== user?.id) {
    return <ForbiddenPage />
  }

  return (
    <>
      <LeaveDocumentBlocker />
      <DocumentPage
        key={document.id}
        document={document}
        onBack={() => navigate('/dashboard')}
      />
    </>
  )
}

function ForbiddenPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      navigate('/dashboard', { replace: true })
    }, 1200)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [navigate])

  return (
    <main className="simple-page">
      <h1>403</h1>
      <p>Нет доступа к чужому документу</p>
    </main>
  )
}

function ProfilePage() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const authError = useAppSelector((state) => state.auth.error)
  const documentsCount = useAppSelector(
    (state) =>
      state.documents.items.filter((document) => document.ownerId === user?.id)
        .length,
  )
  const [name, setName] = useState(user?.name ?? '')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')

  if (!user) {
    return null
  }

  function handleNameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (name.trim().length < 2) {
      setMessage('Введите имя')
      return
    }

    dispatch(updateUserName(name.trim()))
    setMessage('Имя сохранено')
  }

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    dispatch(clearAuthError())

    if (newPassword.length < 8) {
      setMessage('Новый пароль должен быть не короче 8 символов')
      return
    }

    dispatch(changePassword({ oldPassword, newPassword }))
    setOldPassword('')
    setNewPassword('')
    setMessage('Пароль изменён')
  }

  return (
    <main className="simple-page">
      <h1>Профиль</h1>
      <p>Имя: {user.name}</p>
      <p>Email: {user.email}</p>
      <p>Документов: {documentsCount}</p>
      <p>
        Дата регистрации: {new Date(user.registeredAt).toLocaleDateString()}
      </p>

      <form className="profile-form" onSubmit={handleNameSubmit}>
        <h2>Изменить имя</h2>
        <input value={name} onChange={(event) => setName(event.target.value)} />
        <button type="submit">Сохранить имя</button>
      </form>

      <form className="profile-form" onSubmit={handlePasswordSubmit}>
        <h2>Сменить пароль</h2>
        <input
          type="password"
          placeholder="Старый пароль"
          value={oldPassword}
          onChange={(event) => setOldPassword(event.target.value)}
        />
        <input
          type="password"
          placeholder="Новый пароль"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
        <button type="submit">Сохранить пароль</button>
      </form>

      {(message || authError) && <p>{authError || message}</p>}
    </main>
  )
}

function AuthPage({ type }: { type: 'login' | 'register' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const authError = useAppSelector((state) => state.auth.error)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState('')
  const locationState = location.state as { from?: string } | null
  const from = locationState?.from ?? '/dashboard'

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [from, isAuthenticated, navigate])

  function validateForm() {
    if (type === 'register' && name.trim().length < 2) {
      return 'Введите имя'
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      return 'Введите нормальную почту'
    }

    if (password.length < 8) {
      return 'Пароль должен быть не короче 8 символов'
    }

    if (type === 'register' && password !== confirmPassword) {
      return 'Пароли не совпадают'
    }

    return ''
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    dispatch(clearAuthError())

    const error = validateForm()

    if (error) {
      setFormError(error)
      return
    }

    setFormError('')

    if (type === 'login') {
      dispatch(login({ email: email.trim(), password }))
    } else {
      dispatch(register({ name: name.trim(), email: email.trim(), password }))
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>{type === 'login' ? 'Вход' : 'Регистрация'}</h1>

        {type === 'register' && (
          <label className="field">
            <span>Имя</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
        )}

        <label className="field">
          <span>Почта</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {type === 'register' && (
          <label className="field">
            <span>Повторите пароль</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
        )}

        {(formError || authError) && (
          <p className="form-error">{formError || authError}</p>
        )}

        <button type="submit">
          {type === 'login' ? 'Войти' : 'Зарегистрироваться'}
        </button>

        {type === 'login' ? (
          <NavLink to="/register">Создать аккаунт</NavLink>
        ) : (
          <NavLink to="/login">Уже есть аккаунт</NavLink>
        )}
      </form>
    </main>
  )
}

function NotFoundPage({ text = 'Страница не найдена' }: { text?: string }) {
  return (
    <main className="simple-page">
      <h1>404</h1>
      <p>{text}</p>
      <NavLink to="/dashboard">Вернуться к документам</NavLink>
    </main>
  )
}

function AuthStorage({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()
  const accounts = useAppSelector((state) => state.auth.accounts)
  const documents = useAppSelector((state) => state.documents.items)
  const refreshToken = useAppSelector((state) => state.auth.refreshToken)
  const accessTokenExpiresAt = useAppSelector(
    (state) => state.auth.accessTokenExpiresAt,
  )

  useEffect(() => {
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    }
  }, [refreshToken])

  useEffect(() => {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  }, [accounts])

  useEffect(() => {
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents))
  }, [documents])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (accessTokenExpiresAt && accessTokenExpiresAt < Date.now() + 30000) {
        dispatch(refreshAccessToken())
      }
    }, 10000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [accessTokenExpiresAt, dispatch])

  return children
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <AuthPage type="login" />,
  },
  {
    path: '/register',
    element: <AuthPage type="register" />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/dashboard',
            element: <Dashboard />,
          },
          {
            path: '/documents/:documentId',
            element: <SpreadsheetPage />,
          },
          {
            path: '/profile',
            element: <ProfilePage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

function App() {
  return (
    <AuthStorage>
      <RouterProvider router={router} />
    </AuthStorage>
  )
}

export default App
