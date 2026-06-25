import Layout from '../components/Layout';
import StockCard from '../components/StockCard';
import { usePortfolio } from '../hooks/usePortfolio';
import { formatCurrency, formatPercent, pnlColor } from '../utils/format';

function groupByCurrency(
  holdings: { marketValue: number; totalCost: number; pnl: number; dayChange: number; currency: string }[],
) {
  return holdings.reduce(
    (acc, h) => {
      if (!acc[h.currency]) {
        acc[h.currency] = { marketValue: 0, totalCost: 0, pnl: 0, dayChange: 0 };
      }
      acc[h.currency].marketValue += h.marketValue;
      acc[h.currency].totalCost += h.totalCost;
      acc[h.currency].pnl += h.pnl;
      acc[h.currency].dayChange += h.dayChange;
      return acc;
    },
    {} as Record<string, { marketValue: number; totalCost: number; pnl: number; dayChange: number }>,
  );
}

export default function Dashboard() {
  const { portfolio, loading, error, refresh } = usePortfolio(60000);

  if (loading && !portfolio) {
    return (
      <Layout title="대시보드">
        <p className="text-center text-slate-400 py-12">불러오는 중...</p>
      </Layout>
    );
  }

  if (error && !portfolio) {
    return (
      <Layout title="대시보드">
        <div className="rounded-xl border border-red-800 bg-red-900/20 p-4 text-center">
          <p className="text-red-400">{error}</p>
          <button onClick={refresh} className="mt-2 text-sm text-emerald-400 underline">
            다시 시도
          </button>
        </div>
      </Layout>
    );
  }

  const holdings = portfolio?.holdings || [];
  const byCurrency = groupByCurrency(holdings);

  return (
    <Layout title="대시보드">
      <div className="space-y-4">
        {holdings.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-center">
            <p className="text-slate-400">보유 종목이 없습니다.</p>
            <p className="mt-1 text-sm text-slate-500">
              거래 기록에서 종목을 등록하고 매수를 추가하세요.
            </p>
          </div>
        ) : (
          Object.entries(byCurrency).map(([currency, totals]) => {
            const pnlPct = totals.totalCost > 0 ? (totals.pnl / totals.totalCost) * 100 : 0;
            return (
              <div
                key={currency}
                className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 p-5"
              >
                <p className="text-sm text-slate-400">총 평가액 ({currency})</p>
                <p className="mt-1 text-2xl font-bold">
                  {formatCurrency(totals.marketValue, currency)}
                </p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">손익 </span>
                    <span className={pnlColor(totals.pnl)}>
                      {formatCurrency(totals.pnl, currency)} ({formatPercent(pnlPct)})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">일일변동 </span>
                    <span className={pnlColor(totals.dayChange)}>
                      {formatCurrency(totals.dayChange, currency)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div className="flex items-center justify-between">
          <h2 className="font-semibold">보유 종목 ({holdings.length})</h2>
          <button onClick={refresh} className="text-xs text-emerald-400 hover:underline">
            새로고침
          </button>
        </div>

        <div className="space-y-3">
          {holdings.map((h) => (
            <StockCard key={h.stock.id} holding={h} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
