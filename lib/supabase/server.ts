// lib/supabase/server.ts
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

export function createClient() {
  return createServerComponentClient({ cookies });
}
