import { Transaction } from '../api/client'

interface Props {
  transactions: (Transaction & { position: { symbol: string } })[]
}

export default function TransactionHistory({ transactions }: Props) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Keine Transaktionen vorhanden
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
            <th className="pb-3 font-medium">Datum</th>
            <th className="pb-3 font-medium">Symbol</th>
            <th className="pb-3 font-medium">Typ</th>
            <th className="pb-3 font-medium text-right">Anzahl</th>
            <th className="pb-3 font-medium text-right">Preis</th>
            <th className="pb-3 font-medium text-right">Gesamt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-gray-50">
              <td className="py-3">{formatDate(tx.date)}</td>
              <td className="py-3 font-medium">{tx.position.symbol}</td>
              <td className="py-3">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    tx.type === 'BUY'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {tx.type === 'BUY' ? 'Kauf' : 'Verkauf'}
                </span>
              </td>
              <td className="py-3 text-right">{tx.shares.toFixed(2)}</td>
              <td className="py-3 text-right">{formatCurrency(tx.price)}</td>
              <td className="py-3 text-right font-medium">
                {formatCurrency(tx.shares * tx.price)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
