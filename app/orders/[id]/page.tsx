export const dynamic = 'force-dynamic';

import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/seller';
import { getOrderWithCustomer } from '@/lib/queries';
import OrderDetailClient from './OrderDetailClient';

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  if (!(await requireUser())) redirect('/login');
  const data = await getOrderWithCustomer(params.id);
  if (!data) notFound();
  return <OrderDetailClient data={data} />;
}
