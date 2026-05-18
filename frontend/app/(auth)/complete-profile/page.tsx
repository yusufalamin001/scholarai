'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const FACULTIES = [
  { value: 'engineering', label: 'Engineering & Sciences', desc: 'Circuits, calculus, control systems', icon: '⚙️' },
  { value: 'law', label: 'Law', desc: 'Constitutional, criminal, litigation', icon: '⚖️' },
  { value: 'medicine', label: 'Medicine & Health', desc: 'Anatomy, surgery, pharmacology', icon: '🏥' },
  { value: 'business', label: 'Business', desc: 'Accounting, marketing, finance', icon: '📊' },
  { value: 'sciences', label: 'Sciences', desc: 'Biology, chemistry, physics', icon: '🔬' },
  { value: 'general', label: 'Other', desc: 'Arts, education, social sciences', icon: '📚' },
]

export default function CompleteProfilePage() {
  const router = useRouter()
  const [selected, setSelected] = useState('')
  const [university, setUniversity] = useState('')
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState('')
  const [initials, setInitials] = useState('YA')
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student'
      const parts = name.trim().split(' ')
      setUserName(parts[0])
      setInitials(parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase()
      )
    })
  }, [router, supabase.auth])

  const handleSubmit = async () => {
    if (!selected || !university.trim() || loading) return
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    await fetch(`${apiUrl}/auth/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ faculty: selected, university: university.trim(), onboarding_complete: true })
    })
    router.push('/courses')
  }

  return (
    <div className="w-full max-w-lg">
      <div className="bg-[#141828] border border-[#2A3248] rounded-2xl p-8 shadow-2xl">

        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 bg-[#1C2235] rounded-full flex items-center justify-center border border-[#2A3248]">
              <span className="text-white font-semibold text-xl">{initials}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#0EA5E9] rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">
            Almost there, {userName}! ✨
          </h1>
          <p className="text-slate-400 text-sm">Just one more thing before you start studying</p>
        </div>

        <div className="mb-5">
          <label className="block text-white font-medium mb-2">Your university</label>
          <input
            type="text"
            value={university}
            onChange={e => setUniversity(e.target.value)}
            placeholder="e.g. University of Lagos"
            className="w-full bg-[#1C2235] border border-[#2A3248] text-white placeholder-slate-600 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#0EA5E9] transition-colors"
          />
        </div>

        <p className="text-white font-medium mb-4">What faculty are you in?</p>

        {/* Faculty grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {FACULTIES.map(faculty => (
            <button
              key={faculty.value}
              onClick={() => setSelected(faculty.value)}
              className={`relative text-left p-4 rounded-xl border transition-all ${
                selected === faculty.value
                  ? 'border-[#0EA5E9] bg-[#0EA5E9]/10'
                  : 'border-[#2A3248] bg-[#1C2235] hover:border-[#3A4268]'
              }`}
            >
              {selected === faculty.value && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-[#0EA5E9] rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
              )}
              <span className="text-2xl mb-2 block">{faculty.icon}</span>
              <p className="text-white text-sm font-medium">{faculty.label}</p>
              <p className="text-slate-500 text-xs mt-0.5 leading-tight">{faculty.desc}</p>
            </button>
          ))}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!selected || !university.trim() || loading}
          className="w-full bg-[#1E2540] text-white font-medium py-3 px-4 rounded-xl hover:bg-[#242B45] transition-colors disabled:opacity-40 flex items-center justify-center gap-2 border border-[#2A3258]"
        >
          {loading ? 'Saving...' : "Let's go →"}
        </button>

        <p className="text-center text-xs text-slate-500 mt-4">
          You can change this later in Settings
        </p>
      </div>
    </div>
  )
}