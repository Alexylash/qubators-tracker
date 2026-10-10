import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/seller';
import AddForm from './AddForm';

export default async function AddOrderPage() {
  if (!(await requireUser())) redirect('/login');
  return (
    <Suspense fallback={<main className="p-4 font-bold">Loading…</main>}>
      <AddForm />
    </Suspense>
  );
}
