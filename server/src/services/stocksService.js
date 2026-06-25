import { getDb } from '../db/index.js';
import { validateTicker } from './yahooFinance.js';
import {
  inferMarketFromTicker,
  inferCurrencyFromTicker,
  isValidTickerFormat,
  normalizeTicker,
} from '../utils/ticker.js';

/**
 * @param {{ ticker: string, name?: string, market?: string }} input
 * @param {{ validateTickerFn?: typeof validateTicker }} [deps]
 */
export async function createStock(input, deps = {}) {
  const validate = deps.validateTickerFn ?? validateTicker;

  if (!input.ticker || typeof input.ticker !== 'string') {
    return { ok: false, status: 400, error: 'ticker is required' };
  }

  const normalizedTicker = normalizeTicker(input.ticker);
  if (!isValidTickerFormat(normalizedTicker)) {
    return {
      ok: false,
      status: 400,
      error: 'Invalid ticker format. US: AAPL / KR: 005930.KS or 035720.KQ',
    };
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM stocks WHERE ticker = ?').get(normalizedTicker);
  if (existing) {
    return { ok: false, status: 409, error: 'Stock already registered' };
  }

  const validation = await validate(normalizedTicker);
  let stockName = input.name?.trim();
  let stockMarket = input.market;
  let currency;

  if (validation.valid) {
    stockName = stockName || validation.name;
    stockMarket = stockMarket || validation.market;
    currency = validation.currency;
  } else {
    stockName = stockName || normalizedTicker;
    stockMarket = stockMarket || inferMarketFromTicker(normalizedTicker);
    currency = inferCurrencyFromTicker(normalizedTicker);
  }

  const result = db
    .prepare('INSERT INTO stocks (ticker, name, market, currency) VALUES (?, ?, ?, ?)')
    .run(normalizedTicker, stockName, stockMarket, currency);

  const stock = db.prepare('SELECT * FROM stocks WHERE id = ?').get(result.lastInsertRowid);
  return {
    ok: true,
    stock,
    validationWarning: validation.valid ? null : validation.error,
  };
}

export function listStocks() {
  const db = getDb();
  return db.prepare('SELECT * FROM stocks ORDER BY name ASC').all();
}

export function getStockById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM stocks WHERE id = ?').get(id) ?? null;
}

export function deleteStock(id) {
  const db = getDb();
  const stock = getStockById(id);
  if (!stock) {
    return { ok: false, status: 404, error: 'Stock not found' };
  }

  const txCount = db
    .prepare('SELECT COUNT(*) as count FROM transactions WHERE stock_id = ?')
    .get(stock.id);
  if (txCount.count > 0) {
    return { ok: false, status: 400, error: 'Cannot delete stock with transactions' };
  }

  db.prepare('DELETE FROM stocks WHERE id = ?').run(stock.id);
  return { ok: true };
}
