'use client';

import dynamic from 'next/dynamic';

const ClientProviders = dynamic(
  () => import('./client-providers').then((m) => m.ClientProviders),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading…</p>
      </div>
    ),
  },
);

export function Providers({ children }: { children: React.ReactNode }) {
  return <ClientProviders>{children}</ClientProviders>;
}
