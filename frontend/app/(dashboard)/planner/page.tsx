'use client'

import { useState, useEffect } from 'react'
import { fetchCourses, generatePlan } from '@/lib/api'
import type { Course } from '@/lib/api'

interface CourseInput {
  id: string
  name: string
  code: string
}

interface DaySession {
  day: string
  course: string
  topic: string
  hours: number
  time_slot: string
}

interface Week {
  week_number: number
  theme: string
  daily_study_hours: number
  schedule: DaySession[]
}

interface StudyPlan {
  exam_date: string
  total_weeks: number
  weeks: Week[]
  study_tips: string[]
}

const CGPA_LABELS = [
  { min: 0, max: 1.49, label: 'Pass' },
  { min: 1.5, max: 2.39, label: 'Third Class' },
  { min: 2.4, max: 3.49, label: '2nd Class Lower' },
  { min: 3.5, max: 4.49, label: '2nd Class Upper' },
  { min: 4.5, max: 5.0, label: 'First Class' },
]

const COURSE_COLORS = [
  'bg-[#0EA5E9]/20 text-[#0EA5E9] border border-[#0EA5E9]/30',
  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  'bg-rose-500/20 text-rose-400 border border-rose-500/30',
]

function getCgpaLabel(val: number) {
  return CGPA_LABELS.find(l => val >= l.min && val <= l.max)?.label || 'First Class'
}

function getDaysUntilExam(examDate: string) {
  const diff = new Date(examDate).getTime() - new Date().getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function getTotalHours(plan: StudyPlan) {
  return plan.weeks.reduce((sum, w) =>
    sum + w.schedule.reduce((s, d) => s + d.hours, 0), 0)
}

function getCourseHours(plan: StudyPlan) {
  const map: Record<string, number> = {}
  plan.weeks.forEach(w => w.schedule.forEach(d => {
    map[d.course] = (map[d.course] || 0) + d.hours
  }))
  return Object.entries(map).sort((a, b) => b[1] - a[1])
}

export default function PlannerPage() {
  const [state, setState] = useState<'setup' | 'generating' | 'results'>('setup')
  const [courses, setCourses] = useState<CourseInput[]>([])
  const [examDate, setExamDate] = useState('')
  const [targetCgpa, setTargetCgpa] = useState(4.5)
  const [plan, setPlan] = useState<StudyPlan | null>(null)
  const [error, setError] = useState('')
  const [selectedWeek, setSelectedWeek] = useState(0)
  const [registeredCourses, setRegisteredCourses] = useState<Course[]>([])

  useEffect(() => {
    fetchCourses().then(data => {
      setRegisteredCourses(data)
      if (data.length > 0) {
        setCourses(data.slice(0, 3).map(c => ({
          id: c.id,
          name: c.name,
          code: c.course_code || c.name.slice(0, 8).toUpperCase()
        })))
      } else {
        setCourses([{ id: '1', name: '', code: '' }])
      }
    }).catch(() => {
      setCourses([{ id: '1', name: '', code: '' }])
    })
    const today = new Date()
    today.setDate(today.getDate() + 21)
    setExamDate(today.toISOString().split('T')[0])
  }, [])

  const addCourse = () => {
    setCourses(prev => [...prev, { id: Date.now().toString(), name: '', code: '' }])
  }

  const removeCourse = (id: string) => {
    if (courses.length <= 1) return
    setCourses(prev => prev.filter(c => c.id !== id))
  }

  const updateCourse = (id: string, field: 'name' | 'code', value: string) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  const handleGenerate = async () => {
    const validCourses = courses.filter(c => c.name.trim())
    if (validCourses.length === 0) { setError('Add at least one course'); return }
    if (!examDate) { setError('Set your exam date'); return }
    setError('')
    setState('generating')
    try {
      const data = await generatePlan(
        validCourses.map(c => ({ name: c.name, code: c.code || c.name.slice(0, 6).toUpperCase() })),
        examDate,
        targetCgpa
      )
      setPlan(data)
      setSelectedWeek(0)
      setState('results')
    } catch {
      setError('Failed to generate plan. Make sure the backend is running.')
      setState('setup')
    }
  }

  const daysUntil = plan ? getDaysUntilExam(plan.exam_date) : 0
  const totalHours = plan ? getTotalHours(plan) : 0
  const courseHours = plan ? getCourseHours(plan) : []
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  // ── RESULTS ──────────────────────────────────────────────────
  if (state === 'results' && plan) {
    const week = plan.weeks[selectedWeek]
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-medium px-3 py-1 rounded-full">
                <ClockIcon className="w-3 h-3" /> Exam in {daysUntil} days
              </span>
              <span className="bg-[#0EA5E9]/10 text-[#0EA5E9] border border-[#0EA5E9]/20 text-xs font-medium px-3 py-1 rounded-full">
                {getCgpaLabel(targetCgpa)} Target
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-theme-text">Your Study Plan</h1>
          </div>
          <button
            onClick={() => setState('setup')}
            className="flex items-center gap-2 bg-theme-card border border-theme-border text-theme-muted hover:text-theme-text text-sm px-4 py-2 rounded-xl transition-colors self-start"
          >
            <RefreshIcon className="w-4 h-4" /> Regenerate
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-2 flex-wrap">
              {plan.weeks.map((w, i) => (
                <button key={i} onClick={() => setSelectedWeek(i)}
                  className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                    selectedWeek === i ? 'bg-[#0EA5E9] text-white' : 'bg-theme-card border border-theme-border text-theme-muted hover:text-theme-text'
                  }`}>
                  Week {w.week_number}
                </button>
              ))}
            </div>

            <div className="bg-theme-card border border-theme-border rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-theme-subtle text-xs uppercase tracking-wider mb-0.5">Phase {week.week_number}</p>
                  <p className="text-theme-text font-semibold">{week.theme}</p>
                </div>
                <span className="text-theme-muted text-sm">{week.daily_study_hours}h/day</span>
              </div>
            </div>

            <div className="space-y-2">
              {DAYS.map(day => {
                const sessions = week.schedule.filter(s => s.day === day)
                if (sessions.length === 0) {
                  return (
                    <div key={day} className="flex items-center gap-4 py-1">
                      <span className="text-theme-subtle text-xs w-10 flex-shrink-0">{day.slice(0, 3)}</span>
                      <div className="flex-1 border border-dashed border-theme-border rounded-xl px-4 py-2.5 text-theme-subtle text-xs">Rest day</div>
                    </div>
                  )
                }
                return (
                  <div key={day} className="flex items-start gap-4">
                    <span className="text-theme-muted text-xs w-10 flex-shrink-0 pt-3">{day.slice(0, 3)}</span>
                    <div className="flex-1 space-y-2">
                      {sessions.map((s, i) => {
                        const ci = Math.max(0, courseHours.findIndex(([c]) => c === s.course) % COURSE_COLORS.length)
                        return (
                          <div key={i} className={`rounded-xl px-4 py-2.5 ${COURSE_COLORS[ci]}`}>
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{s.course}</p>
                              <span className="text-xs opacity-70">{s.hours}h · {s.time_slot}</span>
                            </div>
                            <p className="text-xs opacity-80 mt-0.5">{s.topic}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {plan.study_tips.length > 0 && (
              <div className="bg-theme-card border border-theme-border rounded-2xl p-5">
                <p className="text-theme-text font-semibold mb-3">Study Tips</p>
                <ul className="space-y-2">
                  {plan.study_tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-theme-muted text-sm">
                      <span className="text-[#0EA5E9] flex-shrink-0 mt-0.5">✦</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-theme-card border border-theme-border rounded-2xl p-5">
              <p className="text-theme-subtle text-xs uppercase tracking-wider mb-4">Plan Summary</p>
              <div className="flex items-center gap-4 mb-5 p-4 bg-theme-bg rounded-xl">
                <div className="w-10 h-10 bg-[#0EA5E9]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <LightningIcon className="w-5 h-5 text-[#0EA5E9]" />
                </div>
                <div>
                  <p className="text-theme-subtle text-xs">Total Commitment</p>
                  <p className="text-theme-text text-2xl font-bold">{totalHours} <span className="text-sm font-normal text-theme-muted">hrs</span></p>
                </div>
              </div>
              <p className="text-theme-subtle text-xs uppercase tracking-wider mb-3">Focus Allocation</p>
              <div className="space-y-3">
                {courseHours.map(([course, hours], i) => {
                  const pct = Math.round((hours / totalHours) * 100)
                  const priority = i === 0 ? 'High' : i === 1 ? 'Med' : 'Low'
                  const color = i === 0 ? 'bg-[#0EA5E9]' : i === 1 ? 'bg-amber-400' : 'bg-emerald-400'
                  const badge = i === 0 ? 'bg-[#0EA5E9]/10 text-[#0EA5E9]' : i === 1 ? 'bg-amber-400/10 text-amber-400' : 'bg-emerald-400/10 text-emerald-400'
                  return (
                    <div key={course}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
                          <span className="text-theme-text text-xs font-medium truncate max-w-[100px]">{course}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-theme-muted text-xs">{hours}h</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${badge}`}>{priority}</span>
                        </div>
                      </div>
                      <div className="w-full bg-theme-border rounded-full h-1">
                        <div className={`h-1 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-theme-card border border-theme-border rounded-2xl p-5">
              <p className="text-theme-subtle text-xs uppercase tracking-wider mb-3">Plan Details</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-theme-muted">Total weeks</span>
                  <span className="text-theme-text font-medium">{plan.total_weeks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Exam date</span>
                  <span className="text-theme-text font-medium">
                    {new Date(plan.exam_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Target CGPA</span>
                  <span className="text-theme-text font-medium">{targetCgpa.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Courses</span>
                  <span className="text-theme-text font-medium">{courseHours.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── SETUP ────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-theme-text mb-1">Generate Your Study Plan</h1>
        <p className="text-theme-muted text-sm">Tell us your courses and goals — we&apos;ll build a personalised schedule</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-theme-card border border-theme-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="w-4 h-4 text-theme-muted" />
            <p className="text-theme-text font-semibold">Target Exam Date</p>
          </div>
          <input
            type="date"
            value={examDate}
            onChange={e => setExamDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full bg-theme-bg border border-theme-border text-theme-text rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#0EA5E9] transition-colors"
          />
          {examDate && (
            <p className="text-theme-subtle text-xs mt-2">{getDaysUntilExam(examDate)} days from today</p>
          )}
        </div>

        <div className="bg-theme-card border border-theme-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendIcon className="w-4 h-4 text-theme-muted" />
            <p className="text-theme-text font-semibold">Target CGPA</p>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-theme-muted text-xs">Pass</span>
            <span className="text-theme-text font-bold text-xl">
              {targetCgpa.toFixed(2)}<span className="text-theme-muted text-sm font-normal">/5.00</span>
            </span>
            <span className="text-theme-muted text-xs">First Class</span>
          </div>
          <input
            type="range" min="1.0" max="5.0" step="0.05"
            value={targetCgpa}
            onChange={e => setTargetCgpa(parseFloat(e.target.value))}
            className="w-full accent-[#0EA5E9]"
          />
          <p className="text-[#0EA5E9] text-xs font-medium mt-2 text-center">{getCgpaLabel(targetCgpa)}</p>
        </div>
      </div>

      <div className="bg-theme-card border border-theme-border rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-theme-text font-semibold">Current Courses</p>
          <span className="bg-[#0EA5E9]/10 text-[#0EA5E9] text-xs font-medium px-2.5 py-1 rounded-lg">
            {courses.filter(c => c.name.trim()).length} Active
          </span>
        </div>

        <div className="hidden md:grid grid-cols-12 gap-3 text-theme-subtle text-xs uppercase tracking-wider px-1 mb-2">
          <div className="col-span-6">Course Name</div>
          <div className="col-span-5">Course Code</div>
          <div className="col-span-1" />
        </div>

        <div className="space-y-3 mb-4">
          {courses.map(course => (
            <div key={course.id} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-6">
                <input
                  value={course.name}
                  onChange={e => updateCourse(course.id, 'name', e.target.value)}
                  placeholder="Course name"
                  list={`courses-list-${course.id}`}
                  className="w-full bg-theme-bg border border-theme-border text-theme-text placeholder-theme-subtle rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-[#0EA5E9] transition-colors"
                />
                <datalist id={`courses-list-${course.id}`}>
                  {registeredCourses.map(c => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>
              <div className="col-span-5">
                <input
                  value={course.code}
                  onChange={e => updateCourse(course.id, 'code', e.target.value.toUpperCase())}
                  placeholder="e.g. CSC 401"
                  className="w-full bg-theme-bg border border-theme-border text-theme-text placeholder-theme-subtle rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-[#0EA5E9] transition-colors"
                />
              </div>
              <div className="col-span-1 flex justify-center">
                <button
                  onClick={() => removeCourse(course.id)}
                  disabled={courses.length <= 1}
                  className="text-theme-muted hover:text-red-400 disabled:opacity-30 transition-colors"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button onClick={addCourse} className="flex items-center gap-2 text-[#0EA5E9] hover:text-[#38BDF8] text-sm transition-colors">
          <PlusIcon className="w-4 h-4" /> Add Course
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={state === 'generating'}
          className="flex items-center gap-2 bg-[#0EA5E9] hover:bg-[#38BDF8] disabled:opacity-50 text-white font-medium px-8 py-3 rounded-xl transition-colors"
        >
          {state === 'generating' ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
          ) : (
            <><SparkleIcon className="w-4 h-4" /> Generate My Study Plan</>
          )}
        </button>
      </div>
    </div>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
}
function TrendIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
}
function ClockIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
}
function LightningIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
}
function RefreshIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
}
function PlusIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
}
function XIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
}
function SparkleIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
}
