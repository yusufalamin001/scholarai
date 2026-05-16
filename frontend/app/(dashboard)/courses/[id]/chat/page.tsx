'use client'

import { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCourse, queryAI } from '@/lib/api'
import type { Course } from '@/lib/api'
import { useUser } from '@/providers/UserProvider'
import MessageBubble from '@/components/chat/MessageBubble'
import type { Message } from '@/components/chat/MessageBubble'

const TOPIC_SUGGESTIONS = [
  'Summarize this course',
  'Key concepts',
  'Quiz me',
  'Explain in simple terms',
]

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { name } = useUser()
  const [course, setCourse] = useState<Course | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [courseLoading, setCourseLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const greeting = (courseName: string): Message => ({
    id: 'greeting',
    role: 'ai',
    content: `Hi **${name}**! I've read your **${courseName}** materials. Ask me anything about your course.`,
    sources: [],
  })

  useEffect(() => {
    getCourse(id)
      .then(data => {
        setCourse(data)
        setMessages([greeting(data.name)])
      })
      .catch(() => router.push('/courses'))
      .finally(() => setCourseLoading(false))
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (text?: string) => {
    const question = (text || input).trim()
    if (!question || loading) return

    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
    }
    setMessages(prev => [...prev, userMessage])
    setLoading(true)

    try {
      const response = await queryAI(id, question)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response.answer,
        sources: response.sources || [],
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'Sorry, I could not connect to the AI. Make sure the backend is running.',
        sources: [],
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClearChat = () => {
    if (course) setMessages([greeting(course.name)])
  }

  const readyDocuments = (course?.documents || []).filter(d => d.status === 'ready')

  if (courseLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="w-8 h-8 border-2 border-[#0EA5E9] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-0px)] md:h-screen overflow-hidden">

      {/* Left context panel — desktop only */}
      <div className="hidden md:flex flex-col w-48 bg-theme-card border-r border-theme-border flex-shrink-0">
        <div className="p-4 border-b border-theme-border">
          <Link
            href={`/courses/${id}`}
            className="text-theme-muted hover:text-theme-text text-xs flex items-center gap-1 mb-3 transition-colors"
          >
            <BackIcon className="w-3.5 h-3.5" /> Back
          </Link>
          <p className="text-theme-subtle text-[10px] font-semibold uppercase tracking-wider mb-0.5">
            Course Chat
          </p>
          <p className="text-theme-text text-xs font-semibold leading-tight truncate">
            {course?.name}
          </p>
        </div>

        <div className="p-4 border-b border-theme-border">
          <p className="text-theme-subtle text-[10px] font-semibold uppercase tracking-wider mb-3">
            Documents in Context
          </p>
          {readyDocuments.length === 0 ? (
            <p className="text-theme-subtle text-xs">No documents ready yet</p>
          ) : (
            <div className="space-y-2">
              {readyDocuments.map(doc => (
                <div key={doc.id} className="flex items-center gap-2">
                  <FileIcon className="w-3 h-3 text-theme-muted flex-shrink-0" />
                  <span className="text-theme-muted text-xs truncate flex-1">{doc.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4">
          <p className="text-theme-subtle text-[10px] font-semibold uppercase tracking-wider mb-3">
            Topic Suggestions
          </p>
          <div className="flex flex-col gap-1.5">
            {TOPIC_SUGGESTIONS.map(topic => (
              <button
                key={topic}
                onClick={() => handleSend(topic)}
                className="text-left text-xs bg-theme-bg border border-theme-border text-theme-muted hover:text-theme-text hover:border-[#0EA5E9] px-2.5 py-1.5 rounded-lg transition-colors"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3.5 border-b border-theme-border bg-theme-card flex-shrink-0">
          <div className="flex items-center gap-3">
            <Link
              href={`/courses/${id}`}
              className="md:hidden text-theme-muted hover:text-theme-text transition-colors"
            >
              <BackIcon className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#0EA5E9]/10 rounded-lg flex items-center justify-center">
                <span className="text-xs">🎓</span>
              </div>
              <span className="text-theme-text font-semibold text-sm truncate max-w-[200px] md:max-w-none">
                {course?.name}
              </span>
            </div>
          </div>
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 text-theme-muted hover:text-theme-text text-xs transition-colors"
          >
            <ClearIcon className="w-3.5 h-3.5" />
            Clear chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6">
          {messages.map(message => (
            <MessageBubble key={message.id} message={message} userName={name} />
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#0EA5E9]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm">🎓</span>
              </div>
              <div className="flex items-center gap-1 py-3">
                <div className="w-2 h-2 bg-theme-muted rounded-full animate-bounce [animation-delay:0ms]" />
                <div className="w-2 h-2 bg-theme-muted rounded-full animate-bounce [animation-delay:150ms]" />
                <div className="w-2 h-2 bg-theme-muted rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Mobile topic suggestions */}
        <div className="md:hidden flex gap-2 px-4 pb-2 overflow-x-auto scrollbar-hide">
          {TOPIC_SUGGESTIONS.map(topic => (
            <button
              key={topic}
              onClick={() => handleSend(topic)}
              className="text-xs bg-theme-card border border-theme-border text-theme-muted whitespace-nowrap px-3 py-1.5 rounded-xl flex-shrink-0 hover:border-[#0EA5E9] transition-colors"
            >
              {topic}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 md:px-6 py-4 border-t border-theme-border flex-shrink-0">
          <div className="flex items-end gap-3 bg-theme-card border border-theme-border rounded-2xl px-4 py-3 focus-within:border-[#0EA5E9] transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your materials..."
              rows={1}
              className="flex-1 bg-transparent text-theme-text placeholder-theme-subtle text-sm resize-none focus:outline-none leading-relaxed"
              style={{ minHeight: '24px', maxHeight: '128px' }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-8 h-8 bg-[#0EA5E9] hover:bg-[#38BDF8] disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors"
            >
              <SendIcon className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-center text-theme-subtle text-xs mt-2">Powered by Gemini</p>
        </div>
      </div>
    </div>
  )
}

function BackIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
}
function FileIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
}
function ClearIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
}
function SendIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
}