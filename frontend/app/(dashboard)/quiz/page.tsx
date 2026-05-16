'use client'

import { useState, useEffect, useRef } from 'react'
import { fetchCourses, generateQuiz, submitQuiz } from '@/lib/api'
import type { Course } from '@/lib/api'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

type QuizState = 'setup' | 'generating' | 'taking' | 'results'

interface QuizQuestion {
  question: string
  options: string[]
  answer: string
  explanation?: string
}

interface Quiz {
  topic: string
  total: number
  questions: QuizQuestion[]
}

interface QuizResult {
  score: number
  total: number
  percentage: number
  results: Array<{
    question: string
    selected: string
    correct: string
    is_correct: boolean
  }>
}

interface RecentQuiz {
  id: string
  course: string
  topic: string
  score: number
  total: number
  date: string
}

const OPTION_LABELS = ['A', 'B', 'C', 'D']

function decodeUnicode(text: string): string {
  return text
    .replace(/\\u([0-9a-fA-F]{4})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\/u([0-9a-fA-F]{4})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

function QuestionContent({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({ children }) => <span>{children}</span>,
        code: ({ children }) => (
          <code className="bg-theme-bg px-1.5 py-0.5 rounded text-sm">{children}</code>
        ),
      }}
    >
      {decodeUnicode(text)}
    </ReactMarkdown>
  )
}

export default function QuizPage() {
  const [quizState, setQuizState] = useState<QuizState>('setup')
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [topic, setTopic] = useState('')
  const [numQuestions, setNumQuestions] = useState(5)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null)
  const [recentQuizzes, setRecentQuizzes] = useState<RecentQuiz[]>([])
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchCourses().then(data => {
      setCourses(data)
      if (data.length > 0) setSelectedCourse(data[0].id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (quizState === 'taking' && quiz) {
      setTimeLeft(quiz.questions.length * 120)
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            handleSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [quizState, quiz])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleGenerate = async () => {
    if (!selectedCourse) { setError('Please select a course'); return }
    setError('')
    setQuizState('generating')
    try {
      const data = await generateQuiz(selectedCourse, topic, numQuestions)
      setQuiz(data)
      setCurrentQuestion(0)
      setAnswers({})
      setQuizState('taking')
    } catch {
      setError('Failed to generate quiz. Make sure the backend is running.')
      setQuizState('setup')
    }
  }

  const handleAnswer = (questionIndex: number, option: string) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: option }))
  }

  const handleSubmit = async () => {
    if (!quiz) return
    if (timerRef.current) clearInterval(timerRef.current)

    // Calculate score client-side
    let score = 0
    const results = quiz.questions.map((q, i) => {
      const selected = answers[i] || ''
      const is_correct = selected === q.answer
      if (is_correct) score++
      return { question: q.question, selected, correct: q.answer, is_correct }
    })

    const total = quiz.questions.length
    const percentage = Math.round((score / total) * 100)

    try {
      await submitQuiz(selectedCourse, quiz.topic || topic, score, total)
    } catch {
      // Non-fatal — still show results
    }

    const course = courses.find(c => c.id === selectedCourse)
    setRecentQuizzes(prev => [{
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      course: course?.name || 'Unknown',
      topic: quiz.topic || topic || 'General',
      score,
      total,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }, ...prev.slice(0, 5)])

    setQuizResult({ score, total, percentage, results })
    setQuizState('results')
  }

  const handleRetry = () => {
    setQuiz(null)
    setQuizResult(null)
    setAnswers({})
    setCurrentQuestion(0)
    setTopic('')
    setQuizState('setup')
  }

  const selectedCourseName = courses.find(c => c.id === selectedCourse)?.name || ''
  const progress = quiz ? ((currentQuestion + 1) / quiz.questions.length) * 100 : 0
  const answeredCount = Object.keys(answers).length
  const totalQuestions = quiz?.questions.length || 0

  // ── QUIZ TAKING ──────────────────────────────────────────────
  if (quizState === 'taking' && quiz) {
    const question = quiz.questions[currentQuestion]
    const selectedAnswer = answers[currentQuestion]
    const isLast = currentQuestion === quiz.questions.length - 1

    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="flex items-center justify-between px-4 md:px-8 py-3 border-b border-theme-border bg-theme-card flex-shrink-0">
          <span className="text-theme-text font-semibold text-sm truncate max-w-[200px]">
            {selectedCourseName} Quiz
          </span>
          <div className="flex items-center gap-1.5 text-theme-muted text-sm">
            <ClockIcon className="w-4 h-4" />
            <span className={timeLeft < 60 ? 'text-red-400 font-semibold' : ''}>{formatTime(timeLeft)}</span>
          </div>
          <span className="text-theme-muted text-sm">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </span>
        </div>

        <div className="w-full bg-theme-border h-1 flex-shrink-0">
          <div className="h-1 bg-[#0EA5E9] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 flex flex-col items-center">
          <div className="w-full max-w-2xl">
            <div className="bg-theme-card border border-theme-border rounded-2xl p-6 md:p-8 mb-6">
              <p className="text-theme-subtle text-xs font-medium uppercase tracking-wide mb-3">
                Question {currentQuestion + 1}
              </p>
              <p className="text-theme-text text-base md:text-lg leading-relaxed mb-6">
                <QuestionContent text={question.question} />
              </p>

              <div className="space-y-3">
                {question.options.map((option, i) => {
                  const label = OPTION_LABELS[i]
                  const isSelected = selectedAnswer === label
                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(currentQuestion, label)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-[#0EA5E9] border-[#0EA5E9] text-white'
                          : 'bg-theme-bg border-theme-border text-theme-text hover:border-[#0EA5E9]/50'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-theme-card text-theme-muted'
                      }`}>
                        {label}
                      </span>
                      <span className="text-sm leading-relaxed">
                        <QuestionContent text={option.replace(/^[A-D]\.\s*/, '')} />
                      </span>
                      {isSelected && <CheckIcon className="w-4 h-4 text-white ml-auto flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 md:px-8 py-4 border-t border-theme-border bg-theme-card flex-shrink-0">
          <button
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2 text-theme-muted hover:text-theme-text disabled:opacity-40 text-sm transition-colors"
          >
            <BackIcon className="w-4 h-4" /> Previous
          </button>

          <button onClick={handleSubmit} className="text-theme-muted hover:text-red-400 text-sm transition-colors">
            ✕ End Quiz
          </button>

          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={answeredCount < totalQuestions}
              className="flex items-center gap-2 bg-[#0EA5E9] hover:bg-[#38BDF8] disabled:opacity-40 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors"
            >
              Submit <CheckIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(prev => Math.min(quiz.questions.length - 1, prev + 1))}
              className="flex items-center gap-2 bg-[#0EA5E9] hover:bg-[#38BDF8] text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors"
            >
              Next <ForwardIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── RESULTS ──────────────────────────────────────────────────
  if (quizState === 'results' && quizResult) {
    const passed = quizResult.percentage >= 60
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">{passed ? '🎉' : '📚'}</div>
          <h1 className="text-2xl font-bold text-theme-text mb-1">
            {passed ? 'Great job!' : 'Keep studying!'}
          </h1>
          <p className="text-theme-muted text-sm">Quiz complete</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-theme-card border border-theme-border rounded-2xl px-12 py-8 text-center">
            <p className={`text-5xl font-bold mb-1 ${passed ? 'text-[#0EA5E9]' : 'text-amber-400'}`}>
              {quizResult.percentage}%
            </p>
            <p className="text-theme-muted text-sm">{quizResult.score}/{quizResult.total} correct</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-theme-text">Review</h2>
          {quizResult.results.map((r, i) => (
            <div
              key={i}
              className={`bg-theme-card border rounded-2xl p-5 ${
                r.is_correct ? 'border-emerald-500/30' : 'border-red-500/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`text-lg flex-shrink-0 mt-0.5 ${r.is_correct ? 'text-emerald-400' : 'text-red-400'}`}>
                  {r.is_correct ? '✓' : '✗'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-theme-text text-sm mb-2 leading-relaxed">
                    <QuestionContent text={r.question} />
                  </p>
                  {!r.is_correct && (
                    <div className="text-xs space-y-1">
                      <p className="text-red-400">Your answer: {r.selected || 'No answer'}</p>
                      <p className="text-emerald-400">Correct answer: {r.correct}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRetry}
            className="flex-1 bg-theme-card border border-theme-border text-theme-text font-medium py-3 rounded-xl hover:bg-theme-card-hover transition-colors"
          >
            New Quiz
          </button>
          <button
            onClick={() => { setQuizResult(null); setAnswers({}); setCurrentQuestion(0); handleGenerate() }}
            className="flex-1 bg-[#0EA5E9] hover:bg-[#38BDF8] text-white font-medium py-3 rounded-xl transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // ── SETUP ────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-theme-text mb-2">Generate a Quiz</h1>
        <p className="text-theme-muted text-sm">Configure parameters to create a custom study set.</p>
      </div>

      <div className="bg-theme-card border border-theme-border rounded-2xl p-6 md:p-8 mb-8 max-w-xl mx-auto">
        <div className="mb-5">
          <label className="block text-theme-text text-sm font-medium mb-2">Course</label>
          {courses.length === 0 ? (
            <div className="bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-theme-subtle text-sm">
              No courses yet — create one first
            </div>
          ) : (
            <div className="relative">
              <select
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
                className="w-full bg-theme-bg border border-theme-border text-theme-text rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#0EA5E9] transition-colors appearance-none"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.course_code ? `${c.course_code} — ${c.name}` : c.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted pointer-events-none">
                <ChevronIcon className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-theme-text text-sm font-medium">Topic Focus</label>
            <span className="text-theme-subtle text-xs">Optional</span>
          </div>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="Enter topic e.g. Bode Plots"
            className="w-full bg-theme-bg border border-theme-border text-theme-text placeholder-theme-subtle rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#0EA5E9] transition-colors"
          />
        </div>

        <div className="mb-6">
          <label className="block text-theme-text text-sm font-medium mb-1">Number of Questions</label>
          <p className="text-theme-subtle text-xs mb-3">Recommended: 5-10 for quick review</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setNumQuestions(prev => Math.max(1, prev - 1))}
              className="w-9 h-9 bg-theme-bg border border-theme-border text-theme-text rounded-xl flex items-center justify-center hover:border-[#0EA5E9] transition-colors text-lg"
            >
              −
            </button>
            <span className="text-theme-text font-bold text-xl w-8 text-center">{numQuestions}</span>
            <button
              onClick={() => setNumQuestions(prev => Math.min(20, prev + 1))}
              className="w-9 h-9 bg-theme-bg border border-theme-border text-theme-text rounded-xl flex items-center justify-center hover:border-[#0EA5E9] transition-colors text-lg"
            >
              +
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

        <button
          onClick={handleGenerate}
          disabled={quizState === 'generating' || courses.length === 0}
          className="w-full bg-[#0EA5E9] hover:bg-[#38BDF8] disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {quizState === 'generating' ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>✦ Generate Quiz</>
          )}
        </button>
      </div>

      {recentQuizzes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-theme-text mb-4">Recent Quizzes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentQuizzes.map(q => (
              <div key={q.id} className="bg-theme-card border border-theme-border rounded-2xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <span className="bg-theme-bg text-theme-subtle text-xs px-2 py-0.5 rounded-lg">{q.date}</span>
                  <span className={`text-sm font-bold ${q.score / q.total >= 0.6 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {q.score}/{q.total}
                  </span>
                </div>
                <p className="text-theme-text font-medium text-sm mb-0.5">{q.topic}</p>
                <p className="text-theme-muted text-xs mb-4">{q.course}</p>
                <button
                  onClick={() => {
                    setTopic(q.topic)
                    const course = courses.find(c => c.name === q.course)
                    if (course) setSelectedCourse(course.id)
                  }}
                  className="flex items-center gap-1.5 text-theme-muted hover:text-theme-text text-xs transition-colors"
                >
                  <RetryIcon className="w-3.5 h-3.5" /> Retry
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
}
function CheckIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
}
function BackIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
}
function ForwardIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
}
function ChevronIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
}
function RetryIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
}