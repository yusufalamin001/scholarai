'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Suspense } from 'react'

function CallbackHandler() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('onboarding_complete')
              .eq('id', session.user.id)
              .single()

            if (!profile?.onboarding_complete) {
              router.push('/complete-profile')
            } else {
              router.push('/courses')
            }
          } catch {
            router.push('/courses')
          }
        } else if (event === 'INITIAL_SESSION' && !session) {
          router.push('/login?error=auth_failed')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#0EA5E9] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Signing you in...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackHandler />
    </Suspense>
  )
}