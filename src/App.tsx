import { useEffect } from 'react'
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
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setActiveDocumentId } from '@/store/documentsSlice'

function ProtectedRoute() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

function AppLayout() {
  const location = useLocation()
  const documents = useAppSelector((state) => state.documents.items)
  const documentId = location.pathname.startsWith('/documents/')
    ? location.pathname.split('/')[2]
    : null
  const document = documents.find((item) => item.id === documentId)

  return (
    <div className="app-layout">
      <header className="app-header">
        <b>Spreadsheet</b>
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

function ProfilePage() {
  const user = useAppSelector((state) => state.auth.user)
  const documentsCount = useAppSelector((state) => state.documents.items.length)

  return (
    <main className="simple-page">
      <h1>Профиль</h1>
      <p>Имя: {user.name}</p>
      <p>Email: {user.email}</p>
      <p>Документов: {documentsCount}</p>
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

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
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
  return <RouterProvider router={router} />
}

export default App
