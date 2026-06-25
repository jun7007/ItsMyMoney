import type { Portfolio, Stock, StockDetail, Transaction, NewsItem } from '../types';

const PIN_KEY = 'itsmymoney_pin';

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const pin = localStorage.getItem(PIN_KEY);
  if (pin) {
    headers['X-Access-Pin'] = pin;
  }
  return headers;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...options?.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export function setAccessPin(pin: string) {
  localStorage.setItem(PIN_KEY, pin);
}

export function clearAccessPin() {
  localStorage.removeItem(PIN_KEY);
}

export const api = {
  health: () => request<{ status: string }>('/api/health'),

  getPortfolio: () => request<Portfolio>('/api/portfolio'),

  getStockDetail: (id: number) =>
    request<StockDetail>(`/api/portfolio/stock/${id}`),

  getStocks: () => request<Stock[]>('/api/stocks'),

  addStock: (data: { ticker: string; name?: string; market?: string }) =>
    request<Stock>('/api/stocks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteStock: (id: number) =>
    request<{ success: boolean }>(`/api/stocks/${id}`, { method: 'DELETE' }),

  getTransactions: (params?: { stock_id?: number; from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.stock_id) query.set('stock_id', String(params.stock_id));
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    const qs = query.toString();
    return request<Transaction[]>(
      `/api/transactions${qs ? `?${qs}` : ''}`,
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
    request<Transaction>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteTransaction: (id: number) =>
    request<{ success: boolean }>(`/api/transactions/${id}`, { method: 'DELETE' }),

  validateTicker: (ticker: string) =>
    request<{ valid: boolean; name?: string; market?: string; currency?: string; error?: string }>(
      `/api/quotes/validate/${encodeURIComponent(ticker)}`,
    ),

  getNews: (ticker: string) =>
    request<NewsItem[]>(`/api/news/${encodeURIComponent(ticker)}`),
};
