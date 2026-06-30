/** @typedef {typeof ContractIds[keyof typeof ContractIds]} ContractId */

export const ContractIds = Object.freeze({
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
});

/**
 * @param {ContractId} contractId
 * @param {unknown} data
 */
export function contractPayload(contractId, data) {
  return { contractId, data };
}

/**
 * @param {import('express').Response} res
 * @param {ContractId} contractId
 * @param {unknown} data
 * @param {number} [status=200]
 */
export function sendContract(res, contractId, data, status = 200) {
  res.setHeader('X-Contract-Id', contractId);
  res.status(status).json(contractPayload(contractId, data));
}

/**
 * @param {import('express').Response} res
 * @param {ContractId} contractId
 * @param {string} error
 * @param {number} [status=400]
 */
export function sendContractError(res, contractId, error, status = 400) {
  res.setHeader('X-Contract-Id', contractId);
  res.status(status).json({ contractId, error });
}
