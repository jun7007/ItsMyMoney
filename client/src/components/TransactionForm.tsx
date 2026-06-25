import { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { Stock } from '../types';

interface TransactionFormProps {
  onSuccess: () => void;
}

export default function TransactionForm({ onSuccess }: TransactionFormProps) {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [stockId, setStockId] = useState('');
  const [type, setType] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [fee, setFee] = useState('0');
  const [tradedAt, setTradedAt] = useState(new Date().toISOString().slice(0, 16));
  const [memo, setMemo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newTicker, setNewTicker] = useState('');
  const [addingStock, setAddingStock] = useState(false);

  useEffect(() => {
    api.getStocks().then(setStocks).catch(() => {});
  }, []);

  const handleAddStock = async () => {
    if (!newTicker.trim()) return;
    setAddingStock(true);
    setError(null);
    try {
      const stock = await api.addStock({ ticker: newTicker.trim() });
      setStocks((prev) => [...prev, stock]);
      setStockId(String(stock.id));
      setNewTicker('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add stock');
    } finally {
      setAddingStock(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockId || !quantity || !price) {
      setError('종목, 수량, 가격을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.addTransaction({
        stock_id: parseInt(stockId, 10),
        type,
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        fee: parseFloat(fee || '0'),
        traded_at: new Date(tradedAt).toISOString(),
        memo: memo || undefined,
      });
      setQuantity('');
      setPrice('');
      setFee('0');
      setMemo('');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
      <h3 className="font-semibold">거래 추가</h3>

      {error && (
        <p className="rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-400">{error}</p>
      )}

      <div className="flex gap-2">
        <select
          value={stockId}
          onChange={(e) => setStockId(e.target.value)}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
        >
          <option value="">종목 선택</option>
          {stocks.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.ticker})
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="새 종목 티커 (예: AAPL, 005930.KS)"
          value={newTicker}
          onChange={(e) => setNewTicker(e.target.value)}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleAddStock}
          disabled={addingStock}
          className="rounded-lg bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600 disabled:opacity-50"
        >
          등록
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType('BUY')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            type === 'BUY' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          매수
        </button>
        <button
          type="button"
          onClick={() => setType('SELL')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            type === 'SELL' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          매도
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-slate-400">수량</label>
          <input
            type="number"
            step="any"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">단가</label>
          <input
            type="number"
            step="any"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">수수료</label>
          <input
            type="number"
            step="any"
            min="0"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">거래일시</label>
          <input
            type="datetime-local"
            value={tradedAt}
            onChange={(e) => setTradedAt(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-slate-400">메모 (선택)</label>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
      >
        {submitting ? '저장 중...' : '거래 저장'}
      </button>
    </form>
  );
}
