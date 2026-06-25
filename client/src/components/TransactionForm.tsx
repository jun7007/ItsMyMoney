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
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newTicker, setNewTicker] = useState('');
  const [addingStock, setAddingStock] = useState(false);

  useEffect(() => {
    api.getStocks().then(setStocks).catch((err) => {
      setError(err instanceof Error ? err.message : '종목 목록을 불러오지 못했습니다.');
    });
  }, []);

  const registerStock = async (ticker: string) => {
    const result = await api.addStock({ ticker: ticker.trim() });
    setStocks((prev) => {
      if (prev.some((s) => s.id === result.stock.id)) return prev;
      return [...prev, result.stock];
    });
    setStockId(String(result.stock.id));
    setNewTicker('');
    return result;
  };

  const handleAddStock = async () => {
    if (!newTicker.trim()) {
      setError('티커를 입력해주세요.');
      return;
    }
    setAddingStock(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await registerStock(newTicker);
      const warning = result.validationWarning
        ? ` (시세 검증 경고: ${result.validationWarning})`
        : '';
      setSuccess(`종목이 등록되었습니다: ${result.stock.name} (${result.stock.ticker})${warning}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '종목 등록에 실패했습니다.');
    } finally {
      setAddingStock(false);
    }
  };

  const resolveStockId = async (): Promise<number> => {
    if (stockId) return parseInt(stockId, 10);

    if (newTicker.trim()) {
      const result = await registerStock(newTicker);
      return result.stock.id;
    }

    throw new Error('종목을 선택하거나 새 티커를 입력해주세요.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!quantity || !price) {
      setError('수량과 가격을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const resolvedStockId = await resolveStockId();
      const tx = await api.addTransaction({
        stock_id: resolvedStockId,
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
      setSuccess(
        `${tx.stock_name ?? '종목'} ${type === 'BUY' ? '매수' : '매도'} ${tx.quantity}주가 저장되었습니다.`,
      );
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '거래 저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
      <h3 className="font-semibold">거래 추가</h3>

      {error && (
        <p role="alert" className="rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="rounded-lg bg-emerald-900/30 px-3 py-2 text-sm text-emerald-400">
          {success}
        </p>
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
          {addingStock ? '등록 중...' : '등록'}
        </button>
      </div>

      <p className="text-xs text-slate-500">
        티커만 입력하고 거래 저장을 눌러도 종목이 자동 등록됩니다.
      </p>

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
          <label htmlFor="tx-quantity" className="mb-1 block text-xs text-slate-400">수량</label>
          <input
            id="tx-quantity"
            type="number"
            step="any"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="tx-price" className="mb-1 block text-xs text-slate-400">단가</label>
          <input
            id="tx-price"
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
        disabled={submitting || addingStock}
        className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
      >
        {submitting ? '저장 중...' : '거래 저장'}
      </button>
    </form>
  );
}
