import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import TransactionForm from '../components/TransactionForm';
import { api } from '../api/client';
import type { Transaction } from '../types';
import { formatCurrency, formatDateTime } from '../utils/format';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getTransactions();
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm('이 거래를 삭제하시겠습니까?')) return;
    try {
      await api.deleteTransaction(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <Layout title="거래 기록">
      <div className="space-y-6">
        <TransactionForm onSuccess={load} />

        <div>
          <h2 className="mb-3 font-semibold">거래 이력</h2>
          {loading ? (
            <p className="text-center text-slate-400 py-8">불러오는 중...</p>
          ) : error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : transactions.length === 0 ? (
            <p className="text-center text-slate-400 py-8">거래 기록이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {transactions.map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                          tx.type === 'BUY'
                            ? 'bg-emerald-900/50 text-emerald-400'
                            : 'bg-red-900/50 text-red-400'
                        }`}
                      >
                        {tx.type === 'BUY' ? '매수' : '매도'}
                      </span>
                      <span className="truncate text-sm font-medium">{tx.stock_name}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatDateTime(tx.traded_at)} · {tx.quantity}주 @{' '}
                      {formatCurrency(tx.price, tx.currency || 'USD')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="shrink-0 text-xs text-slate-500 hover:text-red-400"
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}
