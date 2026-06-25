import type { Portfolio, Stock, StockDetail, Transaction, NewsItem } from '../types';
import { ContractIds, type ContractId } from '../contracts/ids';
import { unwrapContract } from '../contracts/response';

const PIN_KEY = 'itsmymoney_pin';

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const pin = localStorage.getItem(PIN_KEY);
  if (pin) {
    headers['X-Access-Pin'] = pin;
  }
  return headers;
}

async function request<T>(url: string, contractId?: ContractId, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...options?.headers },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      typeof body === 'object' && body && 'error' in body
        ? String(body.error)
        : `Request failed: ${res.status}`;
    throw new Error(message);
  }

  return unwrapContract<T>(body, contractId);
}

export function setAccessPin(pin: string) {
  localStorage.setItem(PIN_KEY, pin);
}

export function clearAccessPin() {
  localStorage.removeItem(PIN_KEY);
}

export const api = {
  health: () =>
    request<{ status: string; timestamp: string }>('/api/health', ContractIds.HEALTH_CHECK),

  getPortfolio: () => request<Portfolio>('/api/portfolio', ContractIds.PORTFOLIO_GET),

  getStockDetail: (id: number) =>
    request<StockDetail>(`/api/portfolio/stock/${id}`, ContractIds.PORTFOLIO_STOCK_DETAIL),

  getStocks: () => request<Stock[]>('/api/stocks', ContractIds.STOCKS_LIST),

  addStock: async (data: { ticker: string; name?: string; market?: string }) => {
    const result = await request<{ stock: Stock; validationWarning: string | null }>(
      '/api/stocks',
      ContractIds.STOCKS_CREATE,
      { method: 'POST', body: JSON.stringify(data) },
    );
    return result;
  },

  deleteStock: (id: number) =>
    request<{ success: boolean }>(`/api/stocks/${id}`, ContractIds.STOCKS_DELETE, {
      method: 'DELETE',
    }),

  getTransactions: (params?: { stock_id?: number; from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.stock_id) query.set('stock_id', String(params.stock_id));
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    const qs = query.toString();
    return request<Transaction[]>(
      `/api/transactions${qs ? `?${qs}` : ''}`,
      ContractIds.TRANSACTIONS_LIST,
    );
  },

  addTransaction: (data: {
    stock_id: number;
    type: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    fee?: number;
    traded_at: string;
    memo?: string;
  }) =>
    request<Transaction>('/api/transactions', ContractIds.TRANSACTIONS_CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteTransaction: (id: number) =>
    request<{ success: boolean }>(`/api/transactions/${id}`, ContractIds.TRANSACTIONS_DELETE, {
      method: 'DELETE',
    }),

  validateTicker: (ticker: string) =>
    request<{ valid: boolean; name?: string; market?: string; currency?: string }>(
      `/api/quotes/validate/${encodeURIComponent(ticker)}`,
      ContractIds.QUOTES_VALIDATE,
    ),

  getNews: (ticker: string) =>
    request<NewsItem[]>(`/api/news/${encodeURIComponent(ticker)}`, ContractIds.NEWS_GET),
};
