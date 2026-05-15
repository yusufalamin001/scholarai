'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface SidebarProps {
  userName: string
  faculty: string
  userEmail: string
}

const NAV_ITEMS = [
  { label: 'Courses', href: '/courses', icon: CoursesIcon },
  { label: 'Progress', href: '/progress', icon: ProgressIcon },
  { label: 'Quiz Mode', href: '/quiz', icon: QuizIcon },
  { label: 'Study Rooms', href: '/rooms', icon: RoomsIcon },
  { label: 'Study Planner', href: '/planner', icon: PlannerIcon },
]

export default function Sidebar({ userName, faculty, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const supabase = createClient()

  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-52 bg-[#0D1117] flex-col z-40 border-r border-[#1C2235]">
      {/* Logo */}
      <div className="p-4 border-b border-[#1C2235]">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎓</span>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">ScholarAI</p>
            <p className="text-[#475569] text-xs">Academic Workspace</p>
          </div>
        </div>
      </div>

      {/* User card */}
      <div className="p-3 border-b border-[#1C2235]">
        <div className="flex items-center gap-2 bg-[#1C2235] rounded-xl p-2">
          <div className="w-8 h-8 bg-[#0EA5E9]/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-[#0EA5E9] text-xs font-semibold">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">{userName}</p>
            <p className="text-[#475569] text-xs capitalize truncate">{faculty}</p>
          </div>
        </div>
      </div>

      {/* New Study Session */}
      <div className="p-3 border-b border-[#1C2235]">
        <Link
          href="/courses"
          className="flex items-center justify-center gap-2 w-full bg-[#0EA5E9] hover:bg-[#38BDF8] text-white text-xs font-medium py-2 px-3 rounded-xl transition-colors"
        >
          <span>+</span> New Study Session
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href ||
            (item.href !== '/courses' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#0EA5E9]/15 text-[#0EA5E9]'
                  : 'text-[#94A3B8] hover:bg-[#1C2235] hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-[#1C2235] space-y-0.5">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#94A3B8] hover:bg-[#1C2235] hover:text-white transition-colors w-full"
        >
          <ThemeIcon className="w-4 h-4" />
          {theme === 'dark' ? 'Dark Mode' : theme === 'light' ? 'Light Mode' : 'System'}
        </button>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#94A3B8] hover:bg-[#1C2235] hover:text-white transition-colors"
        >
          <SettingsIcon className="w-4 h-4" />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#94A3B8] hover:bg-[#1C2235] hover:text-red-400 transition-colors w-full"
        >
          <SignOutIcon className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

function DashboardIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2"/></svg>
}
function CoursesIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
}
function ProgressIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
}
function QuizIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
}
function RoomsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
}
function PlannerIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
}
function SettingsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3" strokeWidth={2}/></svg>
}
function ThemeIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
}
function SignOutIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
}