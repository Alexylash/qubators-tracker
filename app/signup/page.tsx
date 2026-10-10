'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    if (!name.trim() || !email.trim() || password.length < 8) {
      setError('Name, valid email and 8+ char password required.');
      return;
    }
    setBusy(true);
    const res = await authClient.signUp.email(
      { name: name.trim(), email: email.trim(), password },
      {
        onSuccess: () => router.push('/'),
        onError: (ctx) => {
          setError(ctx.error.message || 'Signup failed');
          setBusy(false);
        }
      }
    );
    if (res.error) {
      setError(res.error.message || 'Signup failed');
      setBusy(false);
    }
  }

  return (
    <main className="p-4">
      <h1 className="text-xl font-extrabold">Join Qubators ⚡</h1>
      <p className="text-sm font-semibold text-gray-600">Never lose an order again.</p>
      <input className="w-full p-3 mt-3 rounded-2xl border-2 border-ink font-semibold bg-white" placeholder="Your name *" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="w-full p-3 mt-2 rounded-2xl border-2 border-ink font-semibold bg-white" placeholder="Email *" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="w-full p-3 mt-2 rounded-2xl border-2 border-ink font-semibold bg-white" placeholder="Password (8+ chars) *" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="mt-3 text-sm font-bold text-[#FF2D55]">{error}</p>}
      <button onClick={submit} disabled={busy} className="w-full mt-4 bg-brand text-white font-extrabold p-4 rounded-2xl border-2 border-ink shadow-hard disabled:opacity-50">
        {busy ? 'Creating…' : 'Create account'}
      </button>
      <p className="mt-3 text-sm font-bold text-center">
        Have an account? <Link href="/login" className="underline">Log in</Link>
      </p>
    </main>
  );
}
