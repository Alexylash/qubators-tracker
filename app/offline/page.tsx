import Link from 'next/link';

export default function Offline() {
  return (
    <main className="p-4 text-center">
      <h1 className="text-xl font-extrabold">You're offline ⚡</h1>
      <p className="mt-2 text-sm font-semibold">
        No network. Your drafts are saved on this device — come back and tap retry.
      </p>
      <Link href="/" className="inline-block mt-4 bg-brand text-white font-extrabold px-6 py-3 rounded-2xl border-2 border-ink shadow-hard">
        Retry →
      </Link>
    </main>
  );
}
