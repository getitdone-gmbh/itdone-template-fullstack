'use client';

import nextDynamic from 'next/dynamic';

const PageContent = nextDynamic(
  () => import('./page-content').then((m) => m.PageContent),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading…</p>
      </div>
    ),
  },
);

export default function Page() {
  return <PageContent />;
}
