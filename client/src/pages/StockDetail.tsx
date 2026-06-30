import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import NewsList from '../components/NewsList';
import { api } from '../api/client';
import type { StockDetail as StockDetailType, NewsItem } from '../types';
import { formatCurrency, formatPercent, formatDateTime, pnlColor } from '../utils/format';

export default function StockDetail() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<StockDetailType | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .getStockDetail(parseInt(id, 10))
      .then((data) => {
        setDetail(data);
        setNewsLoading(true);
        return api.getNews(data.stock.ticker);
      })
      .then(setNews)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => {
        setLoading(false);
        setNewsLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <Layout title="종목 상세">
        <p className="text-center text-slate-400 py-12">불러오는 중...</p>
      </Layout>
    );
  }

  if (error || !detail) {
    return (
      <Layout title="종목 상세">
        <p className="text-red-400 text-center">{error || 'Not found'}</p>
        <Link to="/holdings" className="mt-4 block text-center text-emerald-400 text-sm">
          ← 보유 종목으로
        </Link>
      </Layout>
    );
  }

  const { stock, quantity, avgCost, currentPrice, marketValue, pnl, pnlPct, changePct, currency } =
    detail;

  return (
    <Layout title={stock.name}>
      <div className="space-y-6">
        <Link to="/holdings" className="text-sm text-emerald-400 hover:underline">
          ← 보유 종목
        </Link>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400">{stock.ticker}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{formatCurrency(currentPrice, currency)}</p>
                {detail.quoteUpdatedAt && (
                  <span className="text-[10px] text-slate-500" title={new Date(detail.quoteUpdatedAt).toLocaleString('ko-KR')}>
                    ({new Date(detail.quoteUpdatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 갱신)
                  </span>
                )}
              </div>
              <p className={`text-sm ${pnlColor(changePct)}`}>
                {formatPercent(changePct)} (일일)
              </p>
            </div>
            <span className="rounded bg-slate-800 px-2 py-1 text-xs">{stock.market}</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-400">보유 수량</p>
              <p className="font-medium">{quantity}</p>
            </div>
            <div>
              <p className="text-slate-400">평균 단가</p>
              <p className="font-medium">{formatCurrency(avgCost, currency)}</p>
            </div>
            <div>
              <p className="text-slate-400">평가 금액</p>
              <p className="font-medium">{formatCurrency(marketValue, currency)}</p>
            </div>
            <div>
              <p className="text-slate-400">손익</p>
              <p className={`font-medium ${pnlColor(pnl)}`}>
                {formatCurrency(pnl, currency)} ({formatPercent(pnlPct)})
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-semibold">거래 이력</h2>
          {detail.transactions.length === 0 ? (
            <p className="text-sm text-slate-400">거래 기록이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {detail.transactions.map((tx) => (
                <li
                  key={tx.id}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm"
                >
                  <span
                    className={
                      tx.type === 'BUY' ? 'text-red-400' : 'text-blue-400'
                    }
                  >
                    {tx.type === 'BUY' ? '매수' : '매도'}
                  </span>{' '}
                  {tx.quantity}주 @ {formatCurrency(tx.price, currency)}
                  <span className="ml-2 text-xs text-slate-400">
                    {formatDateTime(tx.traded_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="mb-3 font-semibold">관련 뉴스</h2>
          <NewsList news={news} loading={newsLoading} />
        </div>
      </div>
    </Layout>
  );
}
