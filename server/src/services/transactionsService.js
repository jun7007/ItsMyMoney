import { getDb } from '../db/index.js';
import { computeHoldings } from './portfolio.js';
import { getStockById } from './stocksService.js';

export function listTransactions(filters = {}) {
  const db = getDb();
  const { stock_id, from, to } = filters;

  let query = `
    SELECT t.*, s.ticker, s.name as stock_name, s.currency
    FROM transactions t
    JOIN stocks s ON s.id = t.stock_id
    WHERE 1=1
  `;
  const params = [];

  if (stock_id) {
    query += ' AND t.stock_id = ?';
    params.push(stock_id);
  }
  if (from) {
    query += ' AND t.traded_at >= ?';
    params.push(from);
  }
  if (to) {
    query += ' AND t.traded_at <= ?';
    params.push(to);
  }

  query += ' ORDER BY t.traded_at DESC, t.id DESC';
  return db.prepare(query).all(...params);
}

/**
 * @param {{ stock_id: number, type: string, quantity: number|string, price: number|string, fee?: number|string, traded_at: string, memo?: string }} input
 */
export function createTransaction(input) {
  const { stock_id, type, quantity, price, fee, traded_at, memo } = input;

  if (!stock_id || !type || quantity == null || quantity === '' || price == null || price === '' || !traded_at) {
    return {
      ok: false,
      status: 400,
      error: 'stock_id, type, quantity, price, and traded_at are required',
    };
  }

  if (!['BUY', 'SELL'].includes(type)) {
    return { ok: false, status: 400, error: 'type must be BUY or SELL' };
  }

  const qty = parseFloat(quantity);
  const prc = parseFloat(price);
  const feeAmount = parseFloat(fee || 0);

  if (Number.isNaN(qty) || Number.isNaN(prc) || qty <= 0 || prc < 0 || feeAmount < 0) {
    return { ok: false, status: 400, error: 'Invalid quantity, price, or fee' };
  }

  const stock = getStockById(stock_id);
  if (!stock) {
    return { ok: false, status: 404, error: 'Stock not found' };
  }

  if (type === 'SELL') {
    const { quantity: held } = computeHoldings(stock_id);
    if (qty > held) {
      return {
        ok: false,
        status: 400,
        error: `Insufficient quantity. You hold ${held} shares.`,
      };
    }
  }

  const db = getDb();
  const result = db
    .prepare(`
      INSERT INTO transactions (stock_id, type, quantity, price, fee, traded_at, memo)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(stock_id, type, qty, prc, feeAmount, traded_at, memo || null);

  const transaction = db
    .prepare(`
      SELECT t.*, s.ticker, s.name as stock_name, s.currency
      FROM transactions t
      JOIN stocks s ON s.id = t.stock_id
      WHERE t.id = ?
    `)
    .get(result.lastInsertRowid);

  return { ok: true, transaction };
}

export function deleteTransaction(id) {
  const db = getDb();
  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  if (!transaction) {
    return { ok: false, status: 404, error: 'Transaction not found' };
  }

  db.prepare('DELETE FROM transactions WHERE id = ?').run(transaction.id);
  return { ok: true };
}
