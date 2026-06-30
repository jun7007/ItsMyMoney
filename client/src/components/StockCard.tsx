import { pnlColor, formatCurrency, formatPercent } from '../utils/format';
import type { Holding } from '../types';
import { Link } from 'react-router-dom';

interface StockCardProps {
  holding: Holding;
  compact?: boolean;
}

export default function StockCard({ holding, compact }: StockCardProps) {
  const { stock, quantity, avgCost, currentPrice, marketValue, pnl, pnlPct, changePct, currency } =
    holding;

  return (
    <Link
      to={`/stocks/${stock.id}`}
      className="block rounded-xl border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-slate-700"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold">{stock.name}</p>
          <p className="text-sm text-slate-400">
            {stock.ticker}
            <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-xs">
              {stock.market}
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold">{formatCurrency(marketValue, currency)}</p>
          <p className={`text-sm ${pnlColor(pnl)}`}>
            {formatCurrency(pnl, currency)} ({formatPercent(pnlPct)})
          </p>
        </div>
      </div>
      {!compact && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-400">
          <div>
            <p>수량</p>
            <p className="text-slate-200">{quantity}</p>
          </div>
          <div>
            <p>평균단가</p>
            <p className="text-slate-200">{formatCurrency(avgCost, currency)}</p>
          </div>
          <div>
            <p>현재가</p>
            <p className={pnlColor(changePct)}>{formatCurrency(currentPrice, currency)}</p>
            {holding.quoteUpdatedAt && (
              <p className="text-[10px] text-slate-500 mt-0.5" title={new Date(holding.quoteUpdatedAt).toLocaleString('ko-KR')}>
                갱신: {new Date(holding.quoteUpdatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>
      )}
    </Link>
  );
}
