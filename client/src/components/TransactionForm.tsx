import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import type { Stock, StockSearchItem } from '../types';

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
  const [addingStock, setAddingStock] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getStocks().then(setStocks).catch((err) => {
      setError(err instanceof Error ? err.message : '종목 목록을 불러오지 못했습니다.');
    });
  }, []);

  const selectedStock = stocks.find((s) => String(s.id) === stockId);
  const isQueryMatchingSelected = selectedStock && searchQuery === `${selectedStock.name} (${selectedStock.ticker})`;

  // Sync search query when stock selection changes
  useEffect(() => {
    if (selectedStock) {
      setSearchQuery(`${selectedStock.name} (${selectedStock.ticker})`);
    } else {
      setSearchQuery('');
    }
  }, [stockId, stocks]);

  // Debounced search for new stocks
  useEffect(() => {
    const selectedStockName = selectedStock ? `${selectedStock.name} (${selectedStock.ticker})` : '';
    if (!searchQuery.trim() || searchQuery === selectedStockName) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await api.searchStocks(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedStock]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLocalStock = async (stock: Stock) => {
    setStockId(String(stock.id));
    setShowDropdown(false);

    // If local name is just the ticker, update it in background with a better name from search results
    const searchMatch = searchResults.find(item => item.ticker === stock.ticker);
    if (searchMatch && stock.name === stock.ticker && searchMatch.name !== stock.ticker) {
      try {
        const result = await api.addStock({
          ticker: stock.ticker,
          name: searchMatch.name,
          market: stock.market,
        });
        setStocks((prev) => prev.map((s) => (s.id === result.stock.id ? result.stock : s)));
      } catch (err) {
        console.error('Failed to update stock name in background:', err);
      }
    }
  };

  const handleSelectSearchItem = async (item: StockSearchItem) => {
    setAddingStock(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await api.addStock({
        ticker: item.ticker,
        name: item.name,
        market: item.market,
      });
      setStocks((prev) => {
        if (prev.some((s) => s.id === result.stock.id)) return prev;
        return [...prev, result.stock];
      });
      setStockId(String(result.stock.id));
      setSuccess(`종목이 등록되었습니다: ${result.stock.name} (${result.stock.ticker})`);
      setShowDropdown(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '종목 등록에 실패했습니다.');
    } finally {
      setAddingStock(false);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (!val) {
      setStockId('');
    }
  };

  const handleFocus = () => {
    setShowDropdown(true);
  };

  const filteredLocalStocks = stocks
    .map((s) => {
      const searchMatch = searchResults.find((item) => item.ticker === s.ticker);
      if (searchMatch && s.name === s.ticker) {
        return { ...s, name: searchMatch.name };
      }
      return s;
    })
    .filter((s) => {
      if (!searchQuery || isQueryMatchingSelected) return true;
      const q = searchQuery.toLowerCase();

      if (s.name.toLowerCase().includes(q) || s.ticker.toLowerCase().includes(q)) {
        return true;
      }

      if (searchResults.some((item) => item.ticker === s.ticker)) {
        return true;
      }

      return false;
    });

  const filteredSearchResults = searchResults.filter(
    (item) => !stocks.some((s) => s.ticker === item.ticker)
  );

  const resolveStockId = async (): Promise<number> => {
    if (stockId) return parseInt(stockId, 10);
    throw new Error('종목을 검색하여 선택해주세요.');
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

      <div className="relative" ref={containerRef}>
        <label htmlFor="stock-search" className="mb-1 block text-xs text-slate-400">종목</label>
        <div className="relative">
          <input
            id="stock-search"
            type="text"
            placeholder="종목명 또는 티커 검색 (예: 삼성전자, AAPL)"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={(e) => {
              e.currentTarget.select();
              handleFocus();
            }}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm pr-8"
            autoComplete="off"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setStockId('');
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {showDropdown && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-750 bg-slate-800 py-1 shadow-xl max-h-60 overflow-y-auto">
            {/* Registered stocks */}
            {filteredLocalStocks.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xxs font-semibold uppercase tracking-wider text-slate-400 bg-slate-850">
                  내 포트폴리오 종목
                </div>
                {filteredLocalStocks.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectLocalStock(s)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700 flex justify-between items-center text-slate-200 cursor-pointer"
                  >
                    <span>{s.name}</span>
                    <span className="text-xs text-slate-400">{s.ticker}</span>
                  </button>
                ))}
              </div>
            )}

            {/* External Search Results */}
            {filteredSearchResults.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xxs font-semibold uppercase tracking-wider text-slate-400 bg-slate-850 border-t border-slate-700/50">
                  새로운 종목 검색 결과
                </div>
                {filteredSearchResults.map((item) => (
                  <button
                    key={item.ticker}
                    type="button"
                    onClick={() => handleSelectSearchItem(item)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700 flex justify-between items-center text-slate-200 cursor-pointer disabled:opacity-50"
                    disabled={addingStock}
                  >
                    <span className="flex items-center gap-1.5">
                      {item.name}
                      <span className="text-xxs rounded bg-slate-700 px-1 py-0.2 text-slate-400">
                        {item.market === 'KR' ? '국내' : '해외'}
                      </span>
                    </span>
                    <span className="text-xs text-slate-400">{item.ticker}</span>
                  </button>
                ))}
              </div>
            )}

            {searching && (
              <div className="px-3 py-2 text-sm text-slate-400 text-center">
                검색 중...
              </div>
            )}

            {filteredLocalStocks.length === 0 && filteredSearchResults.length === 0 && !searching && (
              <div className="px-3 py-3 text-sm text-slate-500 text-center">
                {searchQuery ? '검색 결과가 없습니다.' : '종목명을 입력하여 검색하세요.'}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType('BUY')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors cursor-pointer ${
            type === 'BUY' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          매수
        </button>
        <button
          type="button"
          onClick={() => setType('SELL')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors cursor-pointer ${
            type === 'SELL' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
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
