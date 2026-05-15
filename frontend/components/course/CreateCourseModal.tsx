'use client'

import { useState } from 'react'
import { createCourse } from '@/lib/api'
import type { Course } from '@/lib/api'

const FACULTIES = [
  { value: 'engineering', label: 'Engineering & Sciences' },
  { value: 'law', label: 'Law' },
  { value: 'medicine', label: 'Medicine & Health Sciences' },
  { value: 'business', label: 'Business & Management' },
  { value: 'sciences', label: 'Sciences' },
  { value: 'general', label: 'Other' },
]

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (course: Course) => void
}

export default function CreateCourseModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [faculty, setFaculty] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!faculty) { setError('Please select a faculty'); return }
    setLoading(true)
    setError('')
    try {
      const course = await createCourse({ name, course_code: courseCode, faculty })
      onCreated(course)
      setName('')
      setCourseCode('')
      setFaculty('')
    } catch {
      setError('Failed to create course. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-theme-card border border-theme-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-theme-text font-semibold text-lg">Create New Course</h2>
          <button onClick={onClose} className="text-theme-muted hover:text-theme-text transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-theme-muted text-sm mb-1.5">Course Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Engineering Mathematics"
              required
              className="w-full bg-theme-bg border border-theme-border text-theme-text placeholder-theme-subtle rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-[#0EA5E9] transition-colors"
            />
          </div>

          <div>
            <label className="block text-theme-muted text-sm mb-1.5">Course Code</label>
            <input
              type="text"
              value={courseCode}
              onChange={e => setCourseCode(e.target.value)}
              placeholder="e.g. ENG 301"
              required
              className="w-full bg-theme-bg border border-theme-border text-theme-text placeholder-theme-subtle rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-[#0EA5E9] transition-colors"
            />
          </div>

          <div>
            <label className="block text-theme-muted text-sm mb-1.5">Faculty</label>
            <select
              value={faculty}
              onChange={e => setFaculty(e.target.value)}
              className="w-full bg-theme-bg border border-theme-border text-theme-text rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-[#0EA5E9] transition-colors appearance-none"
            >
              <option value="" disabled>Select faculty</option>
              {FACULTIES.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-theme-border text-theme-muted py-2.5 rounded-xl text-sm font-medium hover:bg-theme-card-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#0EA5E9] hover:bg-[#38BDF8] text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
            >
              {loading ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function XIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
}