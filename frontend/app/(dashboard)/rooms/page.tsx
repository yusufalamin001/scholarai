'use client'

import { useState, useEffect, useRef } from 'react'
import { getRooms, createRoom, joinRoomByCode, deleteRoom, queryRoom, fetchCourses } from '@/lib/api'
import type { Room, Course } from '@/lib/api'
import { useUser } from '@/providers/UserProvider'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

interface Message {
  id: string
  sender: 'user' | 'ai'
  content: string
  timestamp: Date
}

export default function RoomsPage() {
  const { name, avatarUrl } = useUser()
  const [rooms, setRooms] = useState<Room[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [showMobileChat, setShowMobileChat] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Create room form
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomCourse, setNewRoomCourse] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  // Join room form
  const [joinCode, setJoinCode] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState('')

  useEffect(() => {
    Promise.all([getRooms(), fetchCourses()])
      .then(([roomsData, coursesData]) => {
        setRooms(roomsData)
        setCourses(coursesData)
        if (coursesData.length > 0) setNewRoomCourse(coursesData[0].id)
      })
      .catch(() => setError('Could not connect to server'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selectedRoom])

  const handleSelectRoom = (room: Room) => {
    setSelectedRoom(room)
    setShowMobileChat(true)
    if (!messages[room.id]) {
      setMessages(prev => ({
        ...prev,
        [room.id]: [{
          id: 'welcome',
          sender: 'ai',
          content: `Welcome to **${room.name}**! Ask me anything about your course materials, or chat with your study group.`,
          timestamp: new Date()
        }]
      }))
    }
  }

  const handleSend = async () => {
    if (!input.trim() || !selectedRoom || aiLoading) return
    const question = input.trim()
    setInput('')

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: question,
      timestamp: new Date()
    }

    setMessages(prev => ({
      ...prev,
      [selectedRoom.id]: [...(prev[selectedRoom.id] || []), userMsg]
    }))
    setAiLoading(true)

    try {
      const res = await queryRoom(selectedRoom.id, question)
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        content: res.answer,
        timestamp: new Date()
      }
      setMessages(prev => ({
        ...prev,
        [selectedRoom.id]: [...(prev[selectedRoom.id] || []), aiMsg]
      }))
    } catch {
      setMessages(prev => ({
        ...prev,
        [selectedRoom.id]: [...(prev[selectedRoom.id] || []), {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          content: 'Could not connect to the AI. Make sure the backend is running.',
          timestamp: new Date()
        }]
      }))
    } finally {
      setAiLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCreate = async () => {
    if (!newRoomName.trim() || !newRoomCourse) return
    setCreateLoading(true)
    try {
      const room = await createRoom(newRoomName.trim(), newRoomCourse)
      setRooms(prev => [room, ...prev])
      setShowCreate(false)
      setNewRoomName('')
      handleSelectRoom(room)
    } catch {
      setError('Failed to create room')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!joinCode.trim()) return
    setJoinLoading(true)
    setJoinError('')
    try {
      const res = await joinRoomByCode(joinCode.trim())
      const room = res.room as Room
      setRooms(prev => {
        if (prev.find(r => r.id === room.id)) return prev
        return [room, ...prev]
      })
      setShowJoin(false)
      setJoinCode('')
      handleSelectRoom(room)
    } catch (e: any) {
      setJoinError(e.message || 'Invalid invite code')
    } finally {
      setJoinLoading(false)
    }
  }

  const handleDelete = async (roomId: string) => {
    await deleteRoom(roomId)
    setRooms(prev => prev.filter(r => r.id !== roomId))
    if (selectedRoom?.id === roomId) {
      setSelectedRoom(null)
      setShowMobileChat(false)
    }
  }

  const roomMessages = selectedRoom ? (messages[selectedRoom.id] || []) : []
  const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Left panel — room list */}
      <div className={`${showMobileChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 border-r border-theme-border bg-theme-card flex-shrink-0`}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-theme-border">
          <h1 className="text-theme-text font-semibold">Study Rooms</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="w-7 h-7 bg-[#0EA5E9] hover:bg-[#38BDF8] text-white rounded-lg flex items-center justify-center transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-theme-border">
          <div className="relative">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
            <input
              placeholder="Search rooms..."
              className="w-full bg-theme-bg border border-theme-border text-theme-text placeholder-theme-subtle rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#0EA5E9] transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* My Rooms */}
          <div className="px-4 pt-4 pb-2">
            <p className="text-theme-subtle text-xs font-semibold uppercase tracking-wider mb-3">My Rooms</p>

            {loading ? (
              <div className="space-y-2">
                {[1, 2].map(i => <div key={i} className="h-16 bg-theme-bg rounded-xl animate-pulse" />)}
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-theme-subtle text-xs">No rooms yet</p>
                <button onClick={() => setShowCreate(true)} className="text-[#0EA5E9] text-xs mt-1 hover:underline">
                  Create one →
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {rooms.map(room => (
                  <div
                    key={room.id}
                    onClick={() => handleSelectRoom(room)}
                    className={`w-full text-left px-3 py-3 rounded-xl transition-all group cursor-pointer ${
                      selectedRoom?.id === room.id
                        ? 'bg-[#0EA5E9]/10 border border-[#0EA5E9]/30'
                        : 'hover:bg-theme-bg border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-theme-text text-sm font-medium truncate flex-1">{room.name}</p>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(room.id) }}
                        className="opacity-0 group-hover:opacity-100 text-theme-muted hover:text-red-400 transition-all flex-shrink-0"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-theme-subtle text-xs font-mono bg-theme-bg px-1.5 py-0.5 rounded">
                        {room.invite_code}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Join by code */}
          <div className="px-4 pt-4 pb-4">
            <p className="text-theme-subtle text-xs font-semibold uppercase tracking-wider mb-3">Join a Room</p>
            <button
              onClick={() => setShowJoin(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 border border-dashed border-theme-border rounded-xl text-theme-muted hover:border-[#0EA5E9] hover:text-[#0EA5E9] text-sm transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
              Enter invite code
            </button>
          </div>
        </div>
      </div>

      {/* Right panel — chat */}
      <div className={`${!showMobileChat ? 'hidden md:flex' : 'flex'} flex-col flex-1 min-w-0 overflow-hidden`}>
        {!selectedRoom ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="text-5xl mb-4">💬</div>
            <h2 className="text-theme-text font-semibold mb-2">Select a Study Room</h2>
            <p className="text-theme-muted text-sm max-w-xs">
              Choose a room from the list or create a new one to start studying with your group.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 bg-[#0EA5E9] hover:bg-[#38BDF8] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
            >
              + Create Room
            </button>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-3.5 border-b border-theme-border bg-theme-card flex-shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden text-theme-muted hover:text-theme-text transition-colors"
                >
                  <BackIcon className="w-5 h-5" />
                </button>
                <div>
                  <p className="text-theme-text font-semibold text-sm">{selectedRoom.name}</p>
                  <p className="text-theme-subtle text-xs font-mono">{selectedRoom.invite_code}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(selectedRoom.invite_code)}
                  className="flex items-center gap-1.5 text-theme-muted hover:text-theme-text text-xs transition-colors border border-theme-border rounded-lg px-2.5 py-1.5"
                >
                  <CopyIcon className="w-3.5 h-3.5" />
                  Copy Code
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
              {roomMessages.map(msg => (
                <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.sender === 'ai' ? 'bg-[#0EA5E9]/10' : 'bg-[#0EA5E9]/20'
                  }`}>
                    {msg.sender === 'ai'
                      ? <span className="text-sm">🎓</span>
                      : avatarUrl
                        ? <img src={avatarUrl} alt={name} className="w-8 h-8 rounded-full object-cover" />
                        : <span className="text-[#0EA5E9] text-xs font-bold">{name[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <div className={`max-w-[75%] ${msg.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                    <p className={`text-xs text-theme-muted mb-1 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                      {msg.sender === 'ai' ? 'ScholarAI' : name} · {formatTime(msg.timestamp)}
                    </p>
                    {msg.sender === 'user' ? (
                      <div className="bg-[#0EA5E9] text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm leading-relaxed">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="bg-theme-card border border-theme-border text-theme-text text-sm px-4 py-3 rounded-2xl rounded-tl-sm leading-relaxed prose prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                            li: ({ children }) => <li className="mb-0.5">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold text-theme-text">{children}</strong>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {aiLoading && (
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

            {/* Input */}
            <div className="px-4 md:px-6 py-4 border-t border-theme-border flex-shrink-0">
              <div className="flex items-end gap-3 bg-theme-card border border-theme-border rounded-2xl px-4 py-3 focus-within:border-[#0EA5E9] transition-colors">
                <textarea
                  value={input}
                  onChange={e => {
                    setInput(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask the group or ScholarAI..."
                  rows={1}
                  className="flex-1 bg-transparent text-theme-text placeholder-theme-subtle text-sm resize-none focus:outline-none"
                  style={{ minHeight: '24px', maxHeight: '120px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || aiLoading}
                  className="flex-shrink-0 w-8 h-8 bg-[#0EA5E9] hover:bg-[#38BDF8] disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors"
                >
                  <SendIcon className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-center text-theme-subtle text-xs mt-2">Powered by Gemini</p>
            </div>
          </>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCreate(false)} />
          <div className="relative bg-[#141828] border border-[#2A3248] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-theme-text font-semibold text-lg mb-5">Create Study Room</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-theme-muted text-sm mb-1.5">Room Name</label>
                <input
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  placeholder="e.g. ECE 514 Study Group"
                  className="w-full bg-theme-bg border border-theme-border text-theme-text placeholder-theme-subtle rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-[#0EA5E9] transition-colors"
                />
              </div>

              <div>
                <label className="block text-theme-muted text-sm mb-1.5">Course</label>
                {courses.length === 0 ? (
                  <p className="text-theme-subtle text-xs">No courses available — create a course first</p>
                ) : (
                  <select
                    value={newRoomCourse}
                    onChange={e => setNewRoomCourse(e.target.value)}
                    className="w-full bg-theme-bg border border-theme-border text-theme-text rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-[#0EA5E9] transition-colors appearance-none"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.course_code ? `${c.course_code} — ${c.name}` : c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 bg-theme-bg border border-theme-border text-theme-muted py-2.5 rounded-xl text-sm hover:text-theme-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={createLoading || !newRoomName.trim() || !newRoomCourse}
                  className="flex-1 bg-[#0EA5E9] hover:bg-[#38BDF8] disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  {createLoading ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowJoin(false)} />
          <div className="relative bg-[#141828] border border-[#2A3248] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-theme-text font-semibold text-lg mb-2">Join a Room</h2>
            <p className="text-theme-muted text-sm mb-5">Enter the invite code shared by your classmate</p>

            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABC12345"
              className="w-full bg-theme-bg border border-theme-border text-theme-text placeholder-theme-subtle rounded-xl py-2.5 px-4 text-sm font-mono focus:outline-none focus:border-[#0EA5E9] transition-colors mb-3"
            />

            {joinError && <p className="text-red-400 text-xs mb-3">{joinError}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowJoin(false); setJoinCode(''); setJoinError('') }}
                className="flex-1 bg-theme-bg border border-theme-border text-theme-muted py-2.5 rounded-xl text-sm hover:text-theme-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleJoin}
                disabled={joinLoading || !joinCode.trim()}
                className="flex-1 bg-[#0EA5E9] hover:bg-[#38BDF8] disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                {joinLoading ? 'Joining...' : 'Join Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
}
function SearchIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
}
function TrashIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
}
function LinkIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
}
function BackIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
}
function CopyIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
}
function SendIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
}
