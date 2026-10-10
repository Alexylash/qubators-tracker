import { headers } from 'next/headers';
import { auth } from './auth';

// All queries MUST scope by this id — never query without sellerId.
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function getSellerId(): Promise<string> {
  const session = await getSession();
  const id = session?.user?.id;
  if (!id) throw new Error('Unauthorized');
  return id;
}

export async function requireUser() {
  const session = await getSession();
  if (!session?.user) return null;
  return session.user;
}
