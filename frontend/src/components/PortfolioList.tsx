import { Portfolio } from '../api/client'

interface Props {
  portfolios: Portfolio[]
  selectedId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  isLoading: boolean
}

export default function PortfolioList({ portfolios, selectedId, onSelect, onDelete, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Portfolios</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Portfolios</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {portfolios.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Keine Portfolios vorhanden
          </div>
        ) : (
          portfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors flex justify-between items-center ${
                selectedId === portfolio.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
              }`}
              onClick={() => onSelect(portfolio.id)}
            >
              <div>
                <h3 className="font-medium">{portfolio.name}</h3>
                <p className="text-sm text-gray-500">
                  {portfolio.positions?.length || 0} Positionen
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('Portfolio wirklich loschen?')) {
                    onDelete(portfolio.id)
                  }
                }}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Loschen"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
