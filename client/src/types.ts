export interface Stock {
  id: number;
  ticker: string;
  name: string;
  market: 'KR' | 'US';
  currency: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  stock_id: number;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  fee: number;
  traded_at: string;
  memo: string | null;
  ticker?: string;
  stock_name?: string;
  currency?: string;
}

export interface Holding {
  stock: Stock;
  quantity: number;
  avgCost: number;
  totalCost: number;
  currentPrice: number;
  marketValue: number;
  pnl: number;
  pnlPct: number;
  changePct: number;
  dayChange: number;
  currency: string;
  quoteUpdatedAt: string | null;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalPnl: number;
  totalPnlPct: number;
  totalDayChange: number;
  holdingCount: number;
}

export interface Portfolio {
  summary: PortfolioSummary;
  holdings: Holding[];
}

export interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  publishedAt: string | null;
  thumbnail: string | null;
}

export interface StockDetail {
  stock: Stock;
  quantity: number;
  avgCost: number;
  totalCost: number;
  currentPrice: number;
  marketValue: number;
  pnl: number;
  pnlPct: number;
  changePct: number;
  currency: string;
  quoteUpdatedAt: string | null;
  transactions: Transaction[];
}

export interface StockSearchItem {
  ticker: string;
  name: string;
  market: 'KR' | 'US';
  currency: string;
}
