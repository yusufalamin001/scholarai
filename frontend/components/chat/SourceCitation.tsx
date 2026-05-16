'use client'

import { useState } from 'react'

interface Props {
  sources: any[]
}

export default function SourceCitation({ sources }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (!sources || sources.length === 0) return null

  return (
    <div className="mt-3 border border-theme-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-theme-card hover:bg-theme-card-hover transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <DocumentIcon className="w-4 h-4 text-theme-muted" />
          <span className="text-theme-muted text-xs font-medium">
            {sources.length} Source{sources.length !== 1 ? 's' : ''}
          </span>
        </div>
        <ChevronIcon
          className={`w-4 h-4 text-theme-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="px-4 py-3 bg-theme-bg space-y-3">
          {sources.map((source, i) => (
            <div key={i} className="text-xs">
              <p className="text-theme-text font-medium">
                {source.metadata?.source || source.metadata?.doc_id || `Source ${i + 1}`}
              </p>
              {source.page_content && (
                <p className="text-theme-subtle mt-1 line-clamp-2 leading-relaxed">
                  {source.page_content}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DocumentIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
}
function ChevronIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
}