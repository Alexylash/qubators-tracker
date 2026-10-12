import './globals.css';
import type { Metadata } from 'next';
import ServiceWorkerRegister from '@/components/ui/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'Qubators Tracker',
  description: 'Never lose an order again.',
  manifest: '/manifest.json',
  icons: [{ rel: 'icon', url: '/icon-192.png' }]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="max-w-[420px] mx-auto min-h-screen">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
