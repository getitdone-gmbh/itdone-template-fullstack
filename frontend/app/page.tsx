'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from 'react-oidc-context';
import { createApi } from '@/lib/api';

export default function Page() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');

  const api = useMemo(() => createApi(auth.user?.access_token), [auth.user?.access_token]);

  const { data: items, isLoading } = useQuery({
    queryKey: ['items', auth.user?.profile.sub],
    queryFn: api.getItems,
    enabled: auth.isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: api.createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setTitle('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) createMutation.mutate(title.trim());
  };

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">Authentication error: {auth.error.message}</p>
          <button
            onClick={() => auth.signinRedirect()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white shadow-sm rounded-lg p-8 text-center max-w-sm w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Items</h1>
          <p className="text-gray-500 mb-6">Sign in to manage your items.</p>
          <button
            onClick={() => auth.signinRedirect()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  const displayName =
    (auth.user?.profile.name as string | undefined) ??
    (auth.user?.profile.email as string | undefined) ??
    auth.user?.profile.sub ??
    'User';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Items</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{displayName}</span>
            <button
              onClick={() => auth.signoutRedirect()}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New item..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={createMutation.isPending || !title.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Add
          </button>
        </form>

        {isLoading ? (
          <p className="text-gray-500 text-center">Loading...</p>
        ) : items?.length === 0 ? (
          <p className="text-gray-500 text-center">No items yet. Add one above.</p>
        ) : (
          <ul className="space-y-2">
            {items?.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm"
              >
                <span className="text-gray-900">{item.title}</span>
                <button
                  onClick={() => deleteMutation.mutate(item.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
