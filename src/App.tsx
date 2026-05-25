import { useState } from 'react'
import Dashboard from '@/Dashboard'
import DocumentPage from '@/DocumentPage'
import { useAppSelector } from '@/store/hooks'

function App() {
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null)
  const activeDocument = useAppSelector((state) =>
    state.documents.find((document) => document.id === activeDocumentId),
  )

  if (activeDocument) {
    return (
      <DocumentPage
        key={activeDocument.id}
        document={activeDocument}
        onBack={() => setActiveDocumentId(null)}
      />
    )
  }

  return <Dashboard onOpenDocument={setActiveDocumentId} />
}

export default App
