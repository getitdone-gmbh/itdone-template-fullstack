'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from 'react-oidc-context';
import { WebStorageStateStore } from 'oidc-client-ts';
import { fetchAppConfig, type AppConfig } from '@/lib/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppConfig()
      .then(setConfig)
      .catch((err) => setError(err?.message ?? 'Failed to load app config'));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <p className="text-red-600">Failed to load app configuration: {error}</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!config.issuer || !config.clientId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <p className="text-gray-700">OIDC is not configured on the backend.</p>
      </div>
    );
  }

  const oidcConfig = {
    authority: config.issuer,
    client_id: config.clientId,
    redirect_uri:
      typeof window !== 'undefined' ? window.location.origin + '/callback' : '',
    post_logout_redirect_uri:
      typeof window !== 'undefined' ? window.location.origin : '',
    scope: 'openid profile email',
    userStore:
      typeof window !== 'undefined'
        ? new WebStorageStateStore({ store: window.localStorage })
        : undefined,
    onSigninCallback: () => {
      window.history.replaceState({}, document.title, '/');
    },
  };

  return (
    <AuthProvider {...oidcConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </AuthProvider>
  );
}
