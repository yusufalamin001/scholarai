'use client'

import { useState, useRef } from 'react'
import { uploadDocument } from '@/lib/api'
import type { CourseDocument } from '@/lib/api'

interface Props {
  courseId: string
  onUploaded: (doc: CourseDocument) => void
}

export default function DocumentUpload({ courseId, onUploaded }: Props) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.pdf')) {
      setError('Only PDF files are supported.')
      return
    }
    setUploading(true)
    setError('')
    try {
      const doc = await uploadDocument(courseId, file)
      onUploaded(doc)
    } catch {
      setError('Upload failed. Make sure the backend is running.')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all ${
          dragging
            ? 'border-[#0EA5E9] bg-[#0EA5E9]/5'
            : 'border-theme-border hover:border-[#0EA5E9]/50 hover:bg-theme-card-hover'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={handleChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-theme-card-hover rounded-2xl flex items-center justify-center">
            {uploading ? (
              <div className="w-5 h-5 border-2 border-[#0EA5E9] border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadIcon className="w-5 h-5 text-theme-muted" />
            )}
          </div>
          <div>
            <p className="text-theme-text font-medium text-sm">
              {uploading ? 'Uploading...' : 'Drag and drop your PDF here'}
            </p>
            <p className="text-theme-muted text-xs mt-1">
              {uploading ? 'Please wait' : 'or click to browse files'}
            </p>
          </div>
          {!uploading && (
            <span className="bg-theme-card border border-theme-border text-theme-muted text-xs px-4 py-2 rounded-xl">
              Browse Files
            </span>
          )}
        </div>
      </div>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  )
}

function UploadIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
}