'use client'

import { useState } from 'react'
import type { CourseDocument } from '@/lib/api'

interface Props {
  documents: CourseDocument[]
  onDelete: (id: string) => void
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const STATUS_CONFIG = {
  ready: { label: 'Ready', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  processing: { label: 'Processing', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  error: { label: 'Error', color: 'text-red-400', bg: 'bg-red-400/10' },
}

export default function DocumentList({ documents, onDelete }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return
    setDeleting(id)
    await onDelete(id)
    setDeleting(null)
  }

  return (
    <div>
      <h3 className="text-theme-text font-semibold mb-3">Uploaded Materials</h3>
      <div className="space-y-2">
        {documents.map(doc => {
          const status = STATUS_CONFIG[doc.status]
          return (
            <div
              key={doc.id}
              className="bg-theme-card border border-theme-border rounded-xl px-4 py-3 flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-theme-card-hover rounded-lg flex items-center justify-center flex-shrink-0">
                <FileIcon className="w-4 h-4 text-theme-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-theme-text text-sm font-medium truncate">{doc.name}</p>
                <p className="text-theme-muted text-xs">{formatBytes(doc.size_bytes)}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg flex-shrink-0 ${status.color} ${status.bg}`}>
                {status.label}
              </span>
              <button
                onClick={() => handleDelete(doc.id)}
                disabled={deleting === doc.id}
                className="text-theme-subtle hover:text-red-400 transition-colors flex-shrink-0"
              >
                {deleting === doc.id
                  ? <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
                  : <TrashIcon className="w-4 h-4" />
                }
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FileIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
}
function TrashIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
}