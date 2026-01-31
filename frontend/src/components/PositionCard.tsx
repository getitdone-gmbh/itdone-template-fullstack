import { Position } from '../api/client'

interface Props {
  position: Position
  onSell: (symbol: string) => void
}

export default function PositionCard({ position, onSell }: Props) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)

  const formatPercent = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'percent', minimumFractionDigits: 2 }).format(value / 100)

  const isPositive = (position.gainLoss || 0) >= 0

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold">{position.symbol}</h3>
          <p className="text-sm text-gray-500">{position.shares.toFixed(2)} Anteile</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">{formatCurrency(position.currentValue || 0)}</p>
          <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{formatCurrency(position.gainLoss || 0)}
            {' '}
            ({isPositive ? '+' : ''}{formatPercent(position.gainLossPercent || 0)})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <p className="text-gray-500">Kaufkurs (Durchschn.)</p>
          <p className="font-medium">{formatCurrency(position.avgPrice)}</p>
        </div>
        <div>
          <p className="text-gray-500">Aktueller Kurs</p>
          <p className="font-medium">{formatCurrency(position.currentPrice || position.avgPrice)}</p>
        </div>
        <div>
          <p className="text-gray-500">Investiert</p>
          <p className="font-medium">{formatCurrency(position.costBasis || 0)}</p>
        </div>
        <div>
          <p className="text-gray-500">Aktueller Wert</p>
          <p className="font-medium">{formatCurrency(position.currentValue || 0)}</p>
        </div>
      </div>

      {position.quote && (
        <div className="text-xs text-gray-400 mb-3">
          Tageshoch: {formatCurrency(position.quote.high)} | Tagestief: {formatCurrency(position.quote.low)}
        </div>
      )}

      <button
        onClick={() => onSell(position.symbol)}
        className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
      >
        Verkaufen
      </button>
    </div>
  )
}
