'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert('Login failed: ' + error.message);
    } else {
      await router.replace('/home');
      router.refresh(); // Re-fetch server-side session
    }
  };

  return (
    <>
      <div className="max-w-md mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Log In</h1>
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
          <button
            onClick={handleLogin}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Log in
          </button>
        </div>
      </div>
    </>
  );
}