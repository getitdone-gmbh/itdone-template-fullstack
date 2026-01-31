import { useState } from 'react'

interface Props {
  symbol: string
  maxShares: number
  currentPrice?: number
  onClose: () => void
  onSell: (data: { symbol: string; shares: number; price: number; date?: string }) => void
  isLoading: boolean
  error?: string
}

export default function SellModal({ symbol, maxShares, currentPrice, onClose, onSell, isLoading, error }: Props) {
  const [shares, setShares] = useState('')
  const [price, setPrice] = useState(currentPrice?.toString() || '')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const effectivePrice = parseFloat(price) || 0
  const effectiveShares = parseFloat(shares) || 0
  const totalValue = effectiveShares * effectivePrice

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (effectiveShares > 0 && effectivePrice > 0) {
      onSell({
        symbol,
        shares: effectiveShares,
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
          <h2 className="text-xl font-semibold mb-4">{symbol} verkaufen</h2>
          <p className="text-sm text-gray-500 mb-4">
            Verfugbar: {maxShares.toFixed(2)} Anteile
          </p>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="shares" className="block text-sm font-medium text-gray-700 mb-1">
                  Anzahl zu verkaufen
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    id="shares"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    min="0.01"
                    max={maxShares}
                    step="0.01"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShares(maxShares.toString())}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Alle
                  </button>
                </div>
                {effectiveShares > maxShares && (
                  <p className="text-sm text-red-600 mt-1">
                    Nicht genug Anteile verfugbar
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Verkaufspreis pro Aktie
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
                {currentPrice && (
                  <p className="text-sm text-gray-500 mt-1">
                    Aktueller Kurs: {formatCurrency(currentPrice)}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Verkaufsdatum
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {effectivePrice > 0 && effectiveShares > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Erlos</p>
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
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={effectiveShares <= 0 || effectiveShares > maxShares || effectivePrice <= 0 || isLoading}
              >
                {isLoading ? 'Verkaufe...' : 'Verkaufen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
