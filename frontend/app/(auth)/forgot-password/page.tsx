'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-[#141828] border border-[#2A3248] rounded-2xl p-8 shadow-2xl">

        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-2xl">🎓</span>
          <span className="text-white font-semibold text-xl">ScholarAI</span>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-[#0EA5E9]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MailIcon className="w-8 h-8 text-[#0EA5E9]" />
            </div>
            <h2 className="text-white font-bold text-xl mb-2">Check your email</h2>
            <p className="text-slate-400 text-sm mb-6">
              We sent a password reset link to <span className="text-white">{email}</span>.
              Check your inbox and click the link to reset your password.
            </p>
            <Link
              href="/login"
              className="text-[#0EA5E9] hover:text-[#38bdf8] text-sm transition-colors"
            >
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white mb-1">Reset your password</h1>
              <p className="text-slate-400 text-sm">
                Enter your email and we&apos;ll send you a reset link
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Email</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <MailIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    required
                    className="w-full bg-[#1C2235] border border-[#2A3248] text-white placeholder-slate-600 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-[#0EA5E9] transition-colors"
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0EA5E9] hover:bg-[#38BDF8] text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-60"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Remember your password?{' '}
              <Link href="/login" className="text-[#0EA5E9] hover:text-[#38bdf8] transition-colors">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
    </svg>
  )
}