import Dashboard from '@/Dashboard'
import DocumentPage from '@/DocumentPage'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setActiveDocumentId } from '@/store/documentsSlice'

function App() {
  const dispatch = useAppDispatch()
  const activeDocumentId = useAppSelector(
    (state) => state.documents.activeDocumentId,
  )
  const activeDocument = useAppSelector((state) =>
    state.documents.items.find((document) => document.id === activeDocumentId),
  )

  if (activeDocument) {
    return (
      <DocumentPage
        key={activeDocument.id}
        document={activeDocument}
        onBack={() => dispatch(setActiveDocumentId(null))}
      />
    )
  }

  return <Dashboard />
}

export default App
