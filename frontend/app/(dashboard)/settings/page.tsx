'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { updateProfile } from '@/lib/api'
import { useUser } from '@/providers/UserProvider'

type Section = 'profile' | 'appearance' | 'security' | 'help'

const FACULTIES = [
  { value: 'engineering', label: 'Engineering & Sciences' },
  { value: 'law', label: 'Law' },
  { value: 'medicine', label: 'Medicine & Health Sciences' },
  { value: 'business', label: 'Business & Management' },
  { value: 'sciences', label: 'Sciences' },
  { value: 'general', label: 'Other' },
]

const NAV_ITEMS = [
  { id: 'profile' as Section, label: 'Profile', icon: PersonIcon },
  { id: 'appearance' as Section, label: 'Appearance', icon: PaletteIcon },
  { id: 'security' as Section, label: 'Account & Security', icon: ShieldIcon },
  { id: 'help' as Section, label: 'Help & Support', icon: HelpIcon },
]

export default function SettingsPage() {
  const router = useRouter()
  const { name, email, faculty: userFaculty } = useUser()
  const { theme, setTheme } = useTheme()
  const supabase = createClient()

  const [activeSection, setActiveSection] = useState<Section>('profile')
  const [showMobileDetail, setShowMobileDetail] = useState(false)
  const [fullName, setFullName] = useState(name)
  const [faculty, setFaculty] = useState(userFaculty)
  const [university, setUniversity] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    setFullName(name)
    setFaculty(userFaculty)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('university, avatar_url').eq('id', user.id).single()
          .then(({ data }) => {
            if (data?.university) setUniversity(data.university)
            if (data?.avatar_url) setAvatarUrl(data.avatar_url)
          })
      }
    })
  }, [name, userFaculty])

  const handleSaveProfile = async () => {
    setSaving(true)
    setSaveError('')
    setSaveSuccess(false)
    try {
      await updateProfile({ full_name: fullName, faculty, university })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch {
      setSaveError('Failed to save changes. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setSaveError('Image must be under 2MB'); return }
    setAvatarUploading(true)
    setSaveError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setAvatarUploading(false); return }
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (uploadError) { setSaveError('Failed to upload image'); setAvatarUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    await updateProfile({ avatar_url: publicUrl })
    setAvatarUrl(publicUrl)
    setAvatarUploading(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
    router.refresh()
  }

  const handleRemoveAvatar = async () => {
    await updateProfile({ avatar_url: '' })
    setAvatarUrl('')
    router.refresh()
  }

  const handlePasswordReset = async () => {
    setResetLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    setResetLoading(false)
    if (!error) setResetSent(true)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const selectSection = (s: Section) => {
    setActiveSection(s)
    setShowMobileDetail(true)
  }

  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <div className="flex h-screen overflow-hidden">
      <div className={`${showMobileDetail ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-64 border-r border-theme-border bg-theme-card flex-shrink-0`}>
        <div className="px-4 py-5 border-b border-theme-border">
          <h1 className="text-theme-text font-semibold text-lg">Settings</h1>
        </div>

        <div className="md:hidden mx-4 mt-4 flex items-center gap-3 bg-theme-bg border border-theme-border rounded-2xl px-4 py-3 mb-2">
          <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-[#0EA5E9] font-bold text-sm">{initials}</span>
          </div>
          <div>
            <p className="text-theme-text text-sm font-semibold">{name}</p>
            <p className="text-theme-subtle text-xs">{FACULTIES.find(f => f.value === faculty)?.label || faculty}</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            return (
              <button key={item.id} onClick={() => selectSection(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  activeSection === item.id ? 'bg-[#0EA5E9]/10 text-[#0EA5E9]' : 'text-theme-muted hover:text-theme-text hover:bg-theme-bg'
                }`}>
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  {item.label}
                </div>
                <ChevronIcon className="w-4 h-4 md:hidden" />
              </button>
            )
          })}
        </nav>

        <div className="p-3 border-t border-theme-border">
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 text-sm transition-colors">
            <SignOutIcon className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      <div className={`${!showMobileDetail ? 'hidden md:flex' : 'flex'} flex-col flex-1 overflow-y-auto`}>
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-theme-border bg-theme-card flex-shrink-0">
          <button onClick={() => setShowMobileDetail(false)} className="text-theme-muted hover:text-theme-text">
            <BackIcon className="w-5 h-5" />
          </button>
          <p className="text-theme-text font-medium">{NAV_ITEMS.find(n => n.id === activeSection)?.label}</p>
        </div>

        <div className="p-4 md:p-8 max-w-2xl">
          {activeSection === 'profile' && (
            <div>
              <h2 className="text-xl font-bold text-theme-text mb-1">Profile</h2>
              <p className="text-theme-muted text-sm mb-6">Manage your personal information</p>

              <div className="flex items-center gap-4 mb-8">
                <div className="relative">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={fullName} className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <div className="w-20 h-20 bg-[#0EA5E9]/20 rounded-full flex items-center justify-center">
                      <span className="text-[#0EA5E9] font-bold text-2xl">{initials}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="cursor-pointer inline-block bg-theme-card border border-theme-border hover:border-[#0EA5E9] text-theme-text text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                    {avatarUploading ? 'Uploading...' : 'Upload photo'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" disabled={avatarUploading} />
                  </label>
                  {avatarUrl && (
                    <button onClick={handleRemoveAvatar} className="block text-theme-subtle hover:text-red-400 text-xs mt-2 transition-colors">
                      Remove photo
                    </button>
                  )}
                  <p className="text-theme-subtle text-xs mt-1">JPG, PNG or WebP · max 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-theme-muted text-xs font-medium uppercase tracking-wide mb-1.5">Full Name</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)}
                    className="w-full bg-theme-bg border border-theme-border text-theme-text rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-[#0EA5E9] transition-colors" />
                </div>
                <div>
                  <label className="block text-theme-muted text-xs font-medium uppercase tracking-wide mb-1.5">Email</label>
                  <div className="relative">
                    <input value={email} readOnly
                      className="w-full bg-theme-bg border border-theme-border text-theme-muted rounded-xl py-2.5 px-4 pr-10 text-sm cursor-not-allowed" />
                    <LockIcon className="w-4 h-4 text-theme-subtle absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-theme-text font-semibold mb-4">Academic Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-theme-muted text-xs font-medium uppercase tracking-wide mb-1.5">University</label>
                    <input value={university} onChange={e => setUniversity(e.target.value)}
                      placeholder="e.g. Lagos State University"
                      className="w-full bg-theme-bg border border-theme-border text-theme-text placeholder-theme-subtle rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-[#0EA5E9] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-theme-muted text-xs font-medium uppercase tracking-wide mb-1.5">Faculty</label>
                    <select value={faculty} onChange={e => setFaculty(e.target.value)}
                      className="w-full bg-theme-bg border border-theme-border text-theme-text rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-[#0EA5E9] transition-colors appearance-none">
                      {FACULTIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {saveError && <p className="text-red-400 text-sm mb-3">{saveError}</p>}
              {saveSuccess && <p className="text-emerald-400 text-sm mb-3">Changes saved successfully ✓</p>}

              <button onClick={handleSaveProfile} disabled={saving}
                className="bg-[#0EA5E9] hover:bg-[#38BDF8] disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-colors mb-10">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>

              <div className="border border-red-500/30 rounded-2xl p-5 bg-red-500/5">
                <h3 className="text-red-400 font-semibold mb-2">Delete Account</h3>
                <p className="text-theme-muted text-sm mb-4">
                  Once you delete your account, there is no going back. All your courses, documents, and progress will be permanently removed.
                </p>
                {!showDeleteConfirm ? (
                  <button onClick={() => setShowDeleteConfirm(true)}
                    className="border border-red-500/50 text-red-400 hover:bg-red-500/10 font-medium px-4 py-2 rounded-xl text-sm transition-colors">
                    Delete Account
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-red-400 text-sm font-medium">Are you absolutely sure?</p>
                    <div className="flex gap-3">
                      <button onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 bg-theme-bg border border-theme-border text-theme-muted py-2 rounded-xl text-sm hover:text-theme-text transition-colors">
                        Cancel
                      </button>
                      <button onClick={() => alert('Please contact support@scholarai.ng to delete your account.')}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-sm font-medium transition-colors">
                        Yes, delete my account
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div>
              <h2 className="text-xl font-bold text-theme-text mb-1">Appearance</h2>
              <p className="text-theme-muted text-sm mb-6">Customise how ScholarAI looks</p>
              <div className="bg-theme-card border border-theme-border rounded-2xl p-5">
                <p className="text-theme-text font-medium mb-4">Theme</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'dark', label: 'Dark', icon: '🌙' },
                    { value: 'light', label: 'Light', icon: '☀️' },
                    { value: 'system', label: 'System', icon: '💻' },
                  ].map(t => (
                    <button key={t.value} onClick={() => setTheme(t.value)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                        theme === t.value ? 'border-[#0EA5E9] bg-[#0EA5E9]/10' : 'border-theme-border bg-theme-bg hover:border-[#0EA5E9]/50'
                      }`}>
                      <span className="text-2xl">{t.icon}</span>
                      <span className={`text-xs font-medium ${theme === t.value ? 'text-[#0EA5E9]' : 'text-theme-muted'}`}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div>
              <h2 className="text-xl font-bold text-theme-text mb-1">Account & Security</h2>
              <p className="text-theme-muted text-sm mb-6">Manage your account security</p>
              <div className="bg-theme-card border border-theme-border rounded-2xl p-5 mb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-theme-text font-medium mb-1">Password</p>
                    <p className="text-theme-muted text-sm">Send a password reset link to your email</p>
                  </div>
                  {resetSent ? (
                    <span className="text-emerald-400 text-sm font-medium flex-shrink-0">Email sent ✓</span>
                  ) : (
                    <button onClick={handlePasswordReset} disabled={resetLoading}
                      className="flex-shrink-0 bg-theme-bg border border-theme-border text-theme-text text-sm font-medium px-4 py-2 rounded-xl hover:border-[#0EA5E9] transition-colors disabled:opacity-50">
                      {resetLoading ? 'Sending...' : 'Reset Password'}
                    </button>
                  )}
                </div>
              </div>
              <div className="bg-theme-card border border-theme-border rounded-2xl p-5">
                <p className="text-theme-text font-medium mb-1">Email Address</p>
                <p className="text-theme-muted text-sm">{email}</p>
                <p className="text-theme-subtle text-xs mt-1">Your email cannot be changed</p>
              </div>
            </div>
          )}

          {activeSection === 'help' && (
            <div>
              <h2 className="text-xl font-bold text-theme-text mb-1">Help & Support</h2>
              <p className="text-theme-muted text-sm mb-6">Answers to common questions</p>
              <div className="space-y-3 mb-6">
                {[
                  { q: 'How do I upload course materials?', a: 'Go to any course, click on it to open the detail page, then use the Upload Document button to add PDFs.' },
                  { q: 'How does the AI answer questions?', a: 'ScholarAI reads your uploaded documents, finds the most relevant sections, and uses Gemini to generate an answer grounded in your materials.' },
                  { q: 'Why is the AI saying it cannot find my topic?', a: 'Make sure your documents are fully processed (status shows "Ready"). If the topic is not covered in your uploads, the AI will say so.' },
                  { q: 'How do Study Rooms work?', a: 'Create a room linked to a course, share the invite code with classmates, and anyone in the room can ask the AI questions about that course.' },
                  { q: 'Can I use ScholarAI for any course?', a: 'Yes — create a course for any subject, upload your lecture notes or textbook chapters, and start studying.' },
                ].map((item, i) => (
                  <details key={i} className="bg-theme-card border border-theme-border rounded-2xl overflow-hidden group">
                    <summary className="px-5 py-4 text-theme-text text-sm font-medium cursor-pointer list-none flex items-center justify-between">
                      {item.q}
                      <ChevronIcon className="w-4 h-4 text-theme-muted group-open:rotate-180 transition-transform flex-shrink-0" />
                    </summary>
                    <div className="px-5 pb-4">
                      <p className="text-theme-muted text-sm leading-relaxed">{item.a}</p>
                    </div>
                  </details>
                ))}
              </div>
              <div className="bg-theme-card border border-theme-border rounded-2xl p-5">
                <p className="text-theme-text font-medium mb-1">Contact Support</p>
                <p className="text-theme-muted text-sm">Email us at <span className="text-[#0EA5E9]">support@scholarai.ng</span></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PersonIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
}
function PaletteIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>
}
function ShieldIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
}
function HelpIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
}
function ChevronIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
}
function SignOutIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
}
function BackIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
}
function LockIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
}
