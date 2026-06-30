export const ContractIds = {
  HEALTH_CHECK: 'health.check',
  STOCKS_LIST: 'stocks.list',
  STOCKS_GET: 'stocks.get',
  STOCKS_CREATE: 'stocks.create',
  STOCKS_DELETE: 'stocks.delete',
  TRANSACTIONS_LIST: 'transactions.list',
  TRANSACTIONS_CREATE: 'transactions.create',
  TRANSACTIONS_DELETE: 'transactions.delete',
  PORTFOLIO_GET: 'portfolio.get',
  PORTFOLIO_STOCK_DETAIL: 'portfolio.stockDetail',
  QUOTES_GET: 'quotes.get',
  QUOTES_VALIDATE: 'quotes.validate',
  NEWS_GET: 'news.get',
  STOCKS_SEARCH: 'stocks.search',
} as const;

export type ContractId = (typeof ContractIds)[keyof typeof ContractIds];
