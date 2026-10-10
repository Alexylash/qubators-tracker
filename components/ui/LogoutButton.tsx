'use client';

import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await authClient.signOut({}, { onSuccess: () => router.push('/login') });
    router.push('/login');
  }
  return (
    <button onClick={logout} className="text-xs font-extrabold px-3 py-2 rounded-full border-2 border-ink bg-white">
      Log out
    </button>
  );
}
