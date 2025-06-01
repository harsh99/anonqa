// components/AuthWrapper.tsx
'use client';

import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { PropsWithChildren, useMemo, useState, useEffect } from 'react';
import AuthStatus from './AuthStatus';
import NotificationsDropdown from './NotificationsDropdown';

export default function AuthWrapper({ children }: PropsWithChildren) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsLoggedIn(!!session?.user);
    };

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session?.user);
    });

    checkSession();

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-4 flex justify-between items-center">
          <AuthStatus />
          {isLoggedIn && (
          <div className="flex items-center">
            <NotificationsDropdown />
          </div>
          )}
        </div>
        {children}
      </div>
    </SessionContextProvider>
  );
}