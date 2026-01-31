import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

interface Props {
  onClose: () => void
  onBuy: (data: { symbol: string; shares: number; price: number; date?: string }) => void
  isLoading: boolean
  error?: string
}

export default function BuyModal({ onClose, onBuy, isLoading, error }: Props) {
  const [symbol, setSymbol] = useState('')
  const [shares, setShares] = useState('')
  const [price, setPrice] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [useCurrentPrice, setUseCurrentPrice] = useState(true)

  const { data: quote, isLoading: quoteLoading } = useQuery({
    queryKey: ['quote', symbol.toUpperCase()],
    queryFn: () => api.getStockQuote(symbol.toUpperCase()),
    enabled: symbol.length >= 1 && useCurrentPrice,
    retry: false,
  })

  const effectivePrice = useCurrentPrice && quote ? quote.price : parseFloat(price) || 0
  const totalValue = (parseFloat(shares) || 0) * effectivePrice

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (symbol && shares && effectivePrice > 0) {
      onBuy({
        symbol: symbol.toUpperCase(),
        shares: parseFloat(shares),
        price: effectivePrice,
        date,
      })
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Aktie kaufen</h2>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-1">
                  Symbol
                </label>
                <input
                  type="text"
                  id="symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="z.B. AAPL, MSFT, GOOGL"
                  autoFocus
                />
                {quoteLoading && <p className="text-sm text-gray-500 mt-1">Lade Kurs...</p>}
                {quote && (
                  <p className="text-sm text-green-600 mt-1">
                    Aktueller Kurs: {formatCurrency(quote.price)}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="shares" className="block text-sm font-medium text-gray-700 mb-1">
                  Anzahl
                </label>
                <input
                  type="number"
                  id="shares"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0.01"
                  step="0.01"
                />
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="useCurrentPrice"
                    checked={useCurrentPrice}
                    onChange={(e) => setUseCurrentPrice(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="useCurrentPrice" className="text-sm text-gray-700">
                    Aktuellen Kurs verwenden
                  </label>
                </div>
                {!useCurrentPrice && (
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                      Kaufpreis pro Aktie
                    </label>
                    <input
                      type="number"
                      id="price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                    />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Kaufdatum
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {effectivePrice > 0 && parseFloat(shares) > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Gesamtwert</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                disabled={!symbol || !shares || effectivePrice <= 0 || isLoading}
              >
                {isLoading ? 'Kaufe...' : 'Kaufen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
