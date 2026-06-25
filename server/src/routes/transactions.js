import { Router } from 'express';
import { getDb } from '../db/index.js';
import { computeHoldings } from '../services/portfolio.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { stock_id, from, to } = req.query;

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

  const transactions = db.prepare(query).all(...params);
  res.json(transactions);
});

router.post('/', (req, res) => {
  const { stock_id, type, quantity, price, fee, traded_at, memo } = req.body;

  if (!stock_id || !type || !quantity || price == null || !traded_at) {
    return res.status(400).json({
      error: 'stock_id, type, quantity, price, and traded_at are required',
    });
  }

  if (!['BUY', 'SELL'].includes(type)) {
    return res.status(400).json({ error: 'type must be BUY or SELL' });
  }

  const qty = parseFloat(quantity);
  const prc = parseFloat(price);
  const feeAmount = parseFloat(fee || 0);

  if (qty <= 0 || prc < 0 || feeAmount < 0) {
    return res.status(400).json({ error: 'Invalid quantity, price, or fee' });
  }

  const db = getDb();
  const stock = db.prepare('SELECT * FROM stocks WHERE id = ?').get(stock_id);
  if (!stock) {
    return res.status(404).json({ error: 'Stock not found' });
  }

  if (type === 'SELL') {
    const { quantity: held } = computeHoldings(stock_id);
    if (qty > held) {
      return res.status(400).json({
        error: `Insufficient quantity. You hold ${held} shares.`,
      });
    }
  }

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

  res.status(201).json(transaction);
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  db.prepare('DELETE FROM transactions WHERE id = ?').run(transaction.id);
  res.json({ success: true });
});

export default router;
