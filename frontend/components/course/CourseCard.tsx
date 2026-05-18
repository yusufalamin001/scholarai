'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Course } from '@/lib/api'

interface CourseCardProps {
  course: Course
  onDelete: (id: string) => void
}

const FACULTY_COLORS: Record<string, string> = {
  engineering: '#0EA5E9',
  law: '#8B5CF6',
  medicine: '#10B981',
  business: '#F59E0B',
  sciences: '#06B6D4',
  general: '#6B7280',
}

export default function CourseCard({ course, onDelete }: CourseCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const color = FACULTY_COLORS[course.faculty] || '#6B7280'

  const handleDelete = async () => {
    if (!confirm(`Delete "${course.name}"? This cannot be undone.`)) return
    setDeleting(true)
    await onDelete(course.id)
  }

  return (
    <div
      className="bg-theme-card border border-theme-border rounded-2xl p-5 hover:border-[#0EA5E9]/40 transition-all relative group"
      style={{ borderLeftColor: color, borderLeftWidth: '3px' }}
    >
      {/* Menu button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-theme-subtle hover:text-theme-text p-1 rounded-lg transition-colors"
        >
          <DotsIcon className="w-4 h-4" />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-8 bg-theme-card border border-theme-border rounded-xl shadow-xl z-10 py-1 min-w-[130px]">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              {deleting ? 'Deleting...' : 'Delete Course'}
            </button>
          </div>
        )}
      </div>

      {/* Course code badge */}
      <span
        className="inline-block text-xs font-medium px-2 py-0.5 rounded-lg mb-3"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {course.course_code}
      </span>

      {/* Course name */}
      <h3 className="text-theme-text font-semibold text-base mb-1 pr-6 leading-tight">
        {course.name}
      </h3>
      <p className="text-theme-muted text-xs mb-4 capitalize">{course.faculty}</p>

      {/* Footer */}
      <Link
        href={`/courses/${course.id}`}
        className="flex items-center justify-center w-full bg-[#0EA5E9]/10 hover:bg-[#0EA5E9] text-[#0EA5E9] hover:text-white text-sm font-medium py-2 rounded-xl transition-all"
      >
        Study Now
      </Link>
    </div>
  )
}

function DotsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
}