import type { CellData } from '@/types'

type PatchDocumentPayload = {
  rowsCount: number
  columnsCount: number
  cells: Record<string, CellData>
  preview: string[][]
  updatedAt: string
}

export async function patchDocument(
  documentId: string,
  payload: PatchDocumentPayload,
) {
  try {
    const response = await fetch(`/documents/${documentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    return response.ok || response.status === 404 || response.status === 405
  } catch {
    return true
  }
}
