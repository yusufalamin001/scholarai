'use client'

import { useState, useEffect, use } from 'react'
import { getCourse, deleteDocument } from '@/lib/api'
import type { Course, CourseDocument } from '@/lib/api'
import { useRouter } from 'next/navigation'
import DocumentUpload from '@/components/course/DocumentUpload'
import DocumentList from '@/components/course/DocumentList'
import Link from 'next/link'

const FACULTY_LABELS: Record<string, string> = {
  engineering: 'Engineering',
  law: 'Law',
  medicine: 'Medicine & Health',
  business: 'Business',
  sciences: 'Sciences',
  general: 'General',
}

type Tab = 'documents' | 'topics' | 'quiz-history'

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [documents, setDocuments] = useState<CourseDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('documents')

  useEffect(() => {
    getCourse(id)
      .then(data => {
        setCourse(data)
        setDocuments(data.documents || [])
      })
      .catch(() => setError('Failed to load course'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDocumentUploaded = (doc: CourseDocument) => {
    setDocuments(prev => [doc, ...prev])
  }

  const handleDocumentDeleted = async (docId: string) => {
    await deleteDocument(docId)
    setDocuments(prev => prev.filter(d => d.id !== docId))
  }

  const readyDocs = documents.filter(d => d.status === 'ready').length
  const totalDocs = documents.length
  const masteryPercent = totalDocs > 0 ? Math.round((readyDocs / totalDocs) * 100) : 0

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-theme-card rounded-xl w-64" />
          <div className="h-4 bg-theme-card rounded-xl w-32" />
          <div className="h-32 bg-theme-card rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="p-4 md:p-8 text-center">
        <p className="text-red-400 mb-4">{error || 'Course not found'}</p>
        <button onClick={() => router.push('/courses')} className="text-[#0EA5E9] text-sm hover:underline">
          ← Back to Courses
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <Link href="/courses" className="text-theme-muted hover:text-theme-text text-sm flex items-center gap-1 mb-4 transition-colors">
        ← Back
      </Link>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#0EA5E9]/15 text-[#0EA5E9] text-xs font-medium px-2.5 py-1 rounded-lg">
              {FACULTY_LABELS[course.faculty] || course.faculty}
            </span>
            <span className="text-theme-muted text-xs">{course.course_code}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-theme-text">{course.name}</h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href={`/quiz?course=${course.id}`}
            className="flex items-center gap-2 bg-theme-card border border-theme-border text-theme-text text-sm font-medium px-4 py-2 rounded-xl hover:bg-theme-card-hover transition-colors"
          >
            <QuizIcon className="w-4 h-4" />
            Generate Quiz
          </Link>
          <Link
            href={`/courses/${course.id}/chat`}
            className="flex items-center gap-2 bg-[#0EA5E9] hover:bg-[#38BDF8] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <AIIcon className="w-4 h-4" />
            Ask AI
          </Link>
        </div>
      </div>

      <div className="bg-theme-card border border-theme-border rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-theme-muted text-xs font-medium uppercase tracking-wide">
            Course Progress
          </span>
          <span className="text-theme-text text-sm font-semibold">
            {readyDocs} of {totalDocs} documents ready ({masteryPercent}%)
          </span>
        </div>
        <div className="w-full bg-theme-border rounded-full h-2">
          <div
            className="h-2 bg-[#0EA5E9] rounded-full transition-all duration-500"
            style={{ width: `${masteryPercent}%` }}
          />
        </div>
      </div>

      <div className="flex gap-1 border-b border-theme-border mb-6">
        {(['documents', 'topics', 'quiz-history'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-[#0EA5E9] text-[#0EA5E9]'
                : 'border-transparent text-theme-muted hover:text-theme-text'
            }`}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {activeTab === 'documents' && (
        <div className="space-y-4">
          <DocumentUpload courseId={course.id} onUploaded={handleDocumentUploaded} />
          {documents.length > 0 && (
            <DocumentList documents={documents} onDelete={handleDocumentDeleted} />
          )}
        </div>
      )}

      {activeTab === 'topics' && (
        <div className="bg-theme-card border border-theme-border rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-theme-muted text-sm">
            Topics will appear here after you start asking questions about your documents.
          </p>
        </div>
      )}

      {activeTab === 'quiz-history' && (
        <div className="bg-theme-card border border-theme-border rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-theme-muted text-sm">
            Your quiz results will appear here after you take a quiz for this course.
          </p>
        </div>
      )}
    </div>
  )
}

function QuizIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
}
function AIIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
}