'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    if (!email.trim() || !password) {
      setError('Email and password required.');
      return;
    }
    setBusy(true);
    const res = await authClient.signIn.email(
      { email: email.trim(), password },
      {
        onSuccess: () => router.push('/'),
        onError: (ctx) => {
          setError(ctx.error.message || 'Login failed');
          setBusy(false);
        }
      }
    );
    if (res.error) {
      setError(res.error.message || 'Login failed');
      setBusy(false);
    }
  }

  return (
    <main className="p-4">
      <h1 className="text-xl font-extrabold">Welcome back ⚡</h1>
      <p className="text-sm font-semibold text-gray-600">Your orders are safe.</p>
      <input className="w-full p-3 mt-3 rounded-2xl border-2 border-ink font-semibold bg-white" placeholder="Email *" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="w-full p-3 mt-2 rounded-2xl border-2 border-ink font-semibold bg-white" placeholder="Password *" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="mt-3 text-sm font-bold text-[#FF2D55]">{error}</p>}
      <button onClick={submit} disabled={busy} className="w-full mt-4 bg-brand text-white font-extrabold p-4 rounded-2xl border-2 border-ink shadow-hard disabled:opacity-50">
        {busy ? 'Logging in…' : 'Log in'}
      </button>
      <p className="mt-3 text-sm font-bold text-center">
        New here? <Link href="/signup" className="underline">Create account</Link>
      </p>
    </main>
  );
}
