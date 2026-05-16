import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/ui/Sidebar'
import BottomNav from '@/components/ui/BottomNav'
import MobileHeader from '@/components/ui/MobileHeader'
import { UserProvider } from '@/providers/UserProvider'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, faculty')
    .eq('id', user.id)
    .single()

  const userName = profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'Student'

  const faculty = profile?.faculty || 'general'

  const userData = {
    name: userName,
    faculty,
    email: user.email || '',
  }

  return (
    <UserProvider user={userData}>
      <div className="flex min-h-screen bg-theme-bg text-theme-text">
        <Sidebar userName={userName} faculty={faculty} userEmail={user.email || ''} />
        <MobileHeader />
        <main className="flex-1 md:ml-52 pb-16 md:pb-0 pt-14 md:pt-0 min-h-screen">
          {children}
        </main>
        <BottomNav />
      </div>
    </UserProvider>
  )
}