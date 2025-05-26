'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Session } from '@supabase/supabase-js';

export default function AuthStatus() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const syncSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      console.log('🧪 Initial session check (client):', session);
      if (error) console.error('❌ Session error:', error);
      setUserEmail(session?.user?.email ?? null);
      setLoading(false);
    };

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('📡 Auth change event:', event, session);
        setUserEmail(session?.user?.email ?? null);
        router.refresh();
      }
    );

    syncSession();

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    router.refresh();
  };

  if (loading) return null;

  return (
    <div className="text-sm text-gray-600 text-right">
      {userEmail ? (
        <span>
          ✅ Logged in as <strong>{userEmail}</strong>{' '}
          <button
            onClick={handleLogout}
            className="ml-2 text-blue-600 underline"
          >
            Log out
          </button>
        </span>
      ) : (
        <span>
          ❌ You are not logged in{' '}
          <Link href="/login" className="ml-2 text-blue-600 underline">
            Log in
          </Link>{' '}
          |{' '}
          <Link href="/signup" className="text-blue-600 underline">
            Sign up
          </Link>
        </span>
      )}
    </div>
  );
}