import { useState } from 'react'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { api, Portfolio } from '../api/client'
import PositionCard from './PositionCard'
import BuyModal from './BuyModal'
import SellModal from './SellModal'
import TransactionHistory from './TransactionHistory'
import PortfolioChart from './PortfolioChart'

interface Props {
  portfolio: Portfolio
}

export default function Dashboard({ portfolio }: Props) {
  const queryClient = useQueryClient()
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [showSellModal, setShowSellModal] = useState(false)
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'positions' | 'transactions'>('positions')

  const { data: transactions } = useQuery({
    queryKey: ['transactions', portfolio.id],
    queryFn: () => api.getTransactions(portfolio.id),
  })

  const buyMutation = useMutation({
    mutationFn: (data: { symbol: string; shares: number; price: number; date?: string }) =>
      api.buyStock(portfolio.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', portfolio.id] })
      queryClient.invalidateQueries({ queryKey: ['transactions', portfolio.id] })
      setShowBuyModal(false)
    },
  })

  const sellMutation = useMutation({
    mutationFn: (data: { symbol: string; shares: number; price: number; date?: string }) =>
      api.sellStock(portfolio.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', portfolio.id] })
      queryClient.invalidateQueries({ queryKey: ['transactions', portfolio.id] })
      setShowSellModal(false)
    },
  })

  const handleSell = (symbol: string) => {
    setSelectedSymbol(symbol)
    setShowSellModal(true)
  }

  const { summary, positions } = portfolio

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)

  const formatPercent = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'percent', minimumFractionDigits: 2 }).format(value / 100)

  return (
    <div className="space-y-6">
      {/* Portfolio Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">{portfolio.name}</h2>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Gesamtwert</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.totalValue)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Investiert</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.totalCostBasis)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Gewinn/Verlust</p>
              <p className={`text-2xl font-bold ${summary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(summary.totalGainLoss)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Rendite</p>
              <p className={`text-2xl font-bold ${summary.totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.totalGainLossPercent >= 0 ? '+' : ''}{formatPercent(summary.totalGainLossPercent)}
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setShowBuyModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Kaufen
          </button>
        </div>
      </div>

      {/* Portfolio Chart */}
      {positions.length > 0 && <PortfolioChart positions={positions} />}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('positions')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'positions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Positionen ({positions.length})
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'transactions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Transaktionen
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'positions' ? (
            positions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Keine Positionen vorhanden. Kaufe deine erste Aktie!
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {positions.map((position) => (
                  <PositionCard key={position.id} position={position} onSell={handleSell} />
                ))}
              </div>
            )
          ) : (
            <TransactionHistory transactions={transactions || []} />
          )}
        </div>
      </div>

      {/* Modals */}
      {showBuyModal && (
        <BuyModal
          onClose={() => setShowBuyModal(false)}
          onBuy={(data) => buyMutation.mutate(data)}
          isLoading={buyMutation.isPending}
          error={buyMutation.error?.message}
        />
      )}

      {showSellModal && selectedSymbol && (
        <SellModal
          symbol={selectedSymbol}
          maxShares={positions.find(p => p.symbol === selectedSymbol)?.shares || 0}
          currentPrice={positions.find(p => p.symbol === selectedSymbol)?.currentPrice}
          onClose={() => {
            setShowSellModal(false)
            setSelectedSymbol(null)
          }}
          onSell={(data) => sellMutation.mutate(data)}
          isLoading={sellMutation.isPending}
          error={sellMutation.error?.message}
        />
      )}
    </div>
  )
}
