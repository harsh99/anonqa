// components/AuthWrapper.tsx
'use client'

import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { PropsWithChildren, useMemo } from 'react'
import TopNav from './TopNav'

export default function AuthWrapper({ children }: PropsWithChildren) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])

  return (
    <SessionContextProvider supabaseClient={supabase}>
      {/* Full-width TopNav */}
      <TopNav />

      {/* Page content with width constraint */}
      <div className="max-w-4xl mx-auto">
        <main className="p-4">{children}</main>
      </div>
    </SessionContextProvider>
  )
}
