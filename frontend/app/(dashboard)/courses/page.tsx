'use client'

import { useState, useEffect } from 'react'
import { fetchCourses, getProgressSummary, deleteCourse } from '@/lib/api'
import type { Course, ProgressSummary } from '@/lib/api'
import { useUser } from '@/providers/UserProvider'
import CourseCard from '@/components/course/CourseCard'
import CreateCourseModal from '@/components/course/CreateCourseModal'
import Link from 'next/link'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  })
}

export default function CoursesPage() {
  const { name } = useUser()
  const [courses, setCourses] = useState<Course[]>([])
  const [progress, setProgress] = useState<ProgressSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [coursesData, progressData] = await Promise.all([
        fetchCourses(),
        getProgressSummary().catch(() => null)
      ])
      setCourses(coursesData)
      setProgress(progressData)
    } catch {
      setError('Could not connect to server. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleDeleteCourse = async (id: string) => {
    await deleteCourse(id)
    setCourses(prev => prev.filter(c => c.id !== id))
  }

  const totalTopics = progress?.courses.reduce((sum, c) => sum + c.topics_covered, 0) ?? 0
  const totalInteractions = progress?.total_interactions ?? 0

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-theme-text">
          {getGreeting()}, {name} 👋
        </h1>
        <p className="text-theme-muted text-sm mt-1 flex items-center gap-1">
          <CalendarIcon className="w-3.5 h-3.5" />
          {formatDate()}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
        <StatCard
          icon={<CoursesStatIcon />}
          label="Active Courses"
          value={loading ? '—' : String(courses.length)}
        />
        <StatCard
          icon={<TopicsStatIcon />}
          label="Topics Covered"
          value={loading ? '—' : String(totalTopics)}
          sub={totalInteractions > 0 ? `${totalInteractions} interactions` : undefined}
        />
        <StatCard
          icon={<QuizStatIcon />}
          label="Total Interactions"
          value={loading ? '—' : String(totalInteractions)}
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={loadData} className="text-red-400 hover:text-red-300 text-sm underline">
            Retry
          </button>
        </div>
      )}

      {/* Courses section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-theme-text">My Courses</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 bg-[#0EA5E9] hover:bg-[#38BDF8] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <span>+</span> New Course
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-theme-card rounded-2xl p-5 border border-theme-border animate-pulse h-40" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-theme-card border border-theme-border rounded-2xl p-12 text-center">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-theme-text font-semibold mb-2">No courses yet</h3>
          <p className="text-theme-muted text-sm mb-6">Create your first course to start studying</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#0EA5E9] hover:bg-[#38BDF8] text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            + Create Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onDelete={handleDeleteCourse}
            />
          ))}
        </div>
      )}

      <CreateCourseModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={course => {
          setCourses(prev => [course, ...prev])
          setShowCreateModal(false)
        }}
      />
    </div>
  )
}

function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="bg-theme-card border border-theme-border rounded-2xl p-4">
      <div className="w-8 h-8 bg-[#0EA5E9]/10 rounded-xl flex items-center justify-center mb-3 text-[#0EA5E9]">
        {icon}
      </div>
      <p className="text-theme-muted text-xs mb-1">{label}</p>
      <p className="text-theme-text text-2xl font-bold">{value}</p>
      {sub && <p className="text-theme-subtle text-xs mt-1">{sub}</p>}
    </div>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
}
function CoursesStatIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
}
function TopicsStatIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
}
function QuizStatIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
}