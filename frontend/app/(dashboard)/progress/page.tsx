'use client'

import { useState, useEffect } from 'react'
import { getProgressSummary, getCourseProgress } from '@/lib/api'
import type { ProgressSummary } from '@/lib/api'
import Link from 'next/link'

interface TopicStat {
  topic_tag: string
  query_count: number
  quiz_count: number
  total: number
}

interface CourseProgressData {
  course_id: string
  total_interactions: number
  topics: TopicStat[]
}

function CircularProgress({ percent, size = 80 }: { percent: number; size?: number }) {
  const radius = size * 0.38
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={size * 0.09} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="#0EA5E9" strokeWidth={size * 0.09}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" className="transition-all duration-1000"
      />
    </svg>
  )
}

function getTopicStatus(topic: TopicStat) {
  if (topic.total >= 3) return 'covered'
  if (topic.total >= 1) return 'in-progress'
  return 'not-started'
}

const STATUS_CONFIG = {
  covered: { label: 'Covered', color: 'text-emerald-400', dot: 'bg-emerald-400', border: 'border-emerald-400/20' },
  'in-progress': { label: 'In Progress', color: 'text-amber-400', dot: 'bg-amber-400', border: 'border-amber-400/20' },
  'not-started': { label: 'Not Started', color: 'text-theme-muted', dot: 'bg-theme-border', border: 'border-theme-border' },
}

export default function ProgressPage() {
  const [summary, setSummary] = useState<ProgressSummary | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [courseProgress, setCourseProgress] = useState<CourseProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [topicsLoading, setTopicsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getProgressSummary()
      .then(data => {
        setSummary(data)
        if (data.courses.length > 0) {
          setSelectedCourse(data.courses[0].course_id)
        }
      })
      .catch(() => setError('Could not connect to server. Make sure the backend is running.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedCourse === 'all') {
      setCourseProgress(null)
      return
    }
    setTopicsLoading(true)
    getCourseProgress(selectedCourse)
      .then(setCourseProgress)
      .catch(() => setCourseProgress(null))
      .finally(() => setTopicsLoading(false))
  }, [selectedCourse])

  const courses = summary?.courses || []
  const totalTopicsCovered = courses.reduce((sum, c) => sum + c.topics_covered, 0)
  const inProgressCount = courseProgress?.topics.filter(t => getTopicStatus(t) === 'in-progress').length || 0
  const notStartedTopics = courseProgress?.topics.filter(t => getTopicStatus(t) === 'not-started') || []
  const suggestedTopics = notStartedTopics.slice(0, 3)
  const selectedCourseName = courses.find(c => c.course_id === selectedCourse)?.course_name || ''

  const overallPercent = totalTopicsCovered > 0
    ? Math.min(100, Math.round((totalTopicsCovered / Math.max(totalTopicsCovered * 2, 10)) * 100))
    : 0

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-theme-text mb-4">My Progress</h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCourse('all')}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                selectedCourse === 'all'
                  ? 'bg-[#0EA5E9] text-white'
                  : 'bg-theme-card border border-theme-border text-theme-muted hover:text-theme-text'
              }`}
            >
              All Courses
            </button>
            {courses.map(course => (
              <button
                key={course.course_id}
                onClick={() => setSelectedCourse(course.course_id)}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                  selectedCourse === course.course_id
                    ? 'bg-[#0EA5E9] text-white'
                    : 'bg-theme-card border border-theme-border text-theme-muted hover:text-theme-text'
                }`}
              >
                {course.course_code || course.course_name}
              </button>
            ))}
          </div>
        </div>

        {/* Overall progress ring */}
        <div className="flex items-center gap-4 bg-theme-card border border-theme-border rounded-2xl px-6 py-4 flex-shrink-0">
          <div className="relative w-20 h-20">
            <CircularProgress percent={overallPercent} size={80} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-theme-text font-bold text-base">{overallPercent}%</span>
            </div>
          </div>
          <div>
            <p className="text-theme-text font-semibold">Complete</p>
            <p className="text-theme-muted text-sm">
              Across {courses.length} course{courses.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Mobile overview stats */}
      <div className="md:hidden grid grid-cols-2 gap-3 mb-6">
        <div className="bg-theme-card border border-theme-border rounded-2xl p-4 text-center">
          <p className="text-theme-text text-2xl font-bold">{totalTopicsCovered}</p>
          <p className="text-theme-muted text-xs mt-1">Topics Mastered</p>
        </div>
        <div className="bg-theme-card border border-theme-border rounded-2xl p-4 text-center">
          <p className="text-theme-text text-2xl font-bold">{inProgressCount}</p>
          <p className="text-theme-muted text-xs mt-1">In Progress</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-theme-card rounded-2xl border border-theme-border animate-pulse h-32" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-theme-card border border-theme-border rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-theme-text font-medium mb-1">No progress yet</p>
          <p className="text-theme-muted text-sm">Start studying to track your progress here</p>
        </div>
      ) : (
        <>
          {/* Course Overview */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-theme-text mb-4">Course Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {courses.map(course => {
                const percent = course.topics_covered > 0
                  ? Math.min(100, Math.round((course.topics_covered / Math.max(course.topics_covered * 2, 5)) * 100))
                  : 0
                return (
                  <button
                    key={course.course_id}
                    onClick={() => setSelectedCourse(course.course_id)}
                    className={`text-left bg-theme-card border rounded-2xl p-5 transition-all hover:border-[#0EA5E9]/50 ${
                      selectedCourse === course.course_id ? 'border-[#0EA5E9]' : 'border-theme-border'
                    }`}
                  >
                    <p className="text-theme-text font-semibold truncate mb-0.5">{course.course_name}</p>
                    <p className="text-theme-muted text-xs mb-3">{course.course_code}</p>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[#0EA5E9] text-xs font-medium">{percent}%</span>
                      <span className="text-theme-subtle text-xs">{course.topics_covered} topics</span>
                    </div>
                    <div className="w-full bg-theme-border rounded-full h-1.5">
                      <div
                        className="h-1.5 bg-[#0EA5E9] rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-theme-subtle text-xs mt-2">
                      {course.total_interactions} interaction{course.total_interactions !== 1 ? 's' : ''}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Topic Breakdown */}
          {selectedCourse !== 'all' && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold text-theme-text">Topic Breakdown</h2>
                <span className="text-theme-muted text-sm">{selectedCourseName}</span>
              </div>

              {topicsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-theme-card rounded-2xl border border-theme-border animate-pulse h-24" />
                  ))}
                </div>
              ) : !courseProgress || courseProgress.topics.length === 0 ? (
                <div className="bg-theme-card border border-theme-border rounded-2xl p-8 text-center">
                  <p className="text-theme-muted text-sm">
                    No topics yet — ask questions in the AI chat to see your topic breakdown here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {courseProgress.topics.map(topic => {
                    const status = getTopicStatus(topic)
                    const config = STATUS_CONFIG[status]
                    return (
                      <div
                        key={topic.topic_tag}
                        className={`bg-theme-card border rounded-2xl p-4 ${config.border}`}
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />
                          <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                        </div>
                        <p className="text-theme-text text-sm font-medium leading-tight mb-1">
                          {topic.topic_tag}
                        </p>
                        <p className="text-theme-subtle text-xs">{topic.total} Queries</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Suggested Next Topics */}
          {suggestedTopics.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-theme-text mb-4">Suggested Next Topics</h2>
              <div className="flex flex-wrap gap-3">
                {suggestedTopics.map(topic => (
                  <Link
                    key={topic.topic_tag}
                    href={selectedCourse !== 'all' ? `/courses/${selectedCourse}/chat` : '/courses'}
                    className="flex items-center gap-2 bg-theme-card border border-theme-border hover:border-[#0EA5E9] text-theme-text px-4 py-2.5 rounded-xl text-sm transition-colors group"
                  >
                    <span className="font-medium">{topic.topic_tag}</span>
                    <span className="text-[#0EA5E9] text-xs group-hover:translate-x-0.5 transition-transform">
                      Study this →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}