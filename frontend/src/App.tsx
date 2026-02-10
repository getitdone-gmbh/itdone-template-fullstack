import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './api/client'

function App() {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')

  const { data: items, isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: api.getItems,
  })

  const createMutation = useMutation({
    mutationFn: api.createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      setTitle('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: api.deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) createMutation.mutate(title.trim())
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Items</h1>
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
              <li key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
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
  )
}

export default App
