import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Qubators Tracker',
  description: 'Never lose an order again.',
  manifest: '/manifest.json'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="max-w-[420px] mx-auto min-h-screen">{children}</body>
    </html>
  );
}
