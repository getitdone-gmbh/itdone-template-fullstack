import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './api/client'
import Dashboard from './components/Dashboard'
import PortfolioList from './components/PortfolioList'
import CreatePortfolioModal from './components/CreatePortfolioModal'

function App() {
  const queryClient = useQueryClient()
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: portfolios, isLoading: portfoliosLoading } = useQuery({
    queryKey: ['portfolios'],
    queryFn: api.getPortfolios,
  })

  const { data: selectedPortfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio', selectedPortfolioId],
    queryFn: () => api.getPortfolio(selectedPortfolioId!),
    enabled: !!selectedPortfolioId,
  })

  const createPortfolioMutation = useMutation({
    mutationFn: api.createPortfolio,
    onSuccess: (newPortfolio) => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
      setSelectedPortfolioId(newPortfolio.id)
      setShowCreateModal(false)
    },
  })

  const deletePortfolioMutation = useMutation({
    mutationFn: api.deletePortfolio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
      setSelectedPortfolioId(null)
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Aktien Portfolio</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Neues Portfolio
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <PortfolioList
              portfolios={portfolios || []}
              selectedId={selectedPortfolioId}
              onSelect={setSelectedPortfolioId}
              onDelete={(id) => deletePortfolioMutation.mutate(id)}
              isLoading={portfoliosLoading}
            />
          </div>

          <div className="lg:col-span-3">
            {selectedPortfolioId ? (
              portfolioLoading ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Lade Portfolio...</p>
                </div>
              ) : selectedPortfolio ? (
                <Dashboard portfolio={selectedPortfolio} />
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-500">Portfolio nicht gefunden</p>
                </div>
              )
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Kein Portfolio ausgewahlt</h3>
                <p className="text-gray-500 mb-4">
                  Wahle ein Portfolio aus der Liste oder erstelle ein neues.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Portfolio erstellen
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {showCreateModal && (
        <CreatePortfolioModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(name) => createPortfolioMutation.mutate(name)}
          isLoading={createPortfolioMutation.isPending}
        />
      )}
    </div>
  )
}

export default App
