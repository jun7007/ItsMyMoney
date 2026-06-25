import Layout from '../components/Layout';
import StockCard from '../components/StockCard';
import { usePortfolio } from '../hooks/usePortfolio';

export default function Holdings() {
  const { portfolio, loading, error, refresh } = usePortfolio(60000);

  if (loading && !portfolio) {
    return (
      <Layout title="보유 종목">
        <p className="text-center text-slate-400 py-12">불러오는 중...</p>
      </Layout>
    );
  }

  const holdings = portfolio?.holdings || [];

  return (
    <Layout title="보유 종목">
      <div className="space-y-4">
        <div className="flex justify-end">
          <button onClick={refresh} className="text-xs text-emerald-400 hover:underline">
            새로고침
          </button>
        </div>

        {error && (
          <p className="rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-400">{error}</p>
        )}

        {holdings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">
            <p className="text-slate-400">보유 종목이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {holdings.map((h) => (
              <StockCard key={h.stock.id} holding={h} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
