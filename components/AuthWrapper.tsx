'use client';

import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { PropsWithChildren, useMemo } from 'react';
import AuthStatus from './AuthStatus';

export default function AuthWrapper({ children }: PropsWithChildren) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-4 text-right space-x-4">
          <AuthStatus />
        </div>
        {children}
      </div>
    </SessionContextProvider>
  );
}