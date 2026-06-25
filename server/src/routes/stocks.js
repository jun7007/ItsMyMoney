import { Router } from 'express';
import { getDb } from '../db/index.js';
import { validateTicker } from '../services/yahooFinance.js';

const router = Router();

router.get('/', (_req, res) => {
  const db = getDb();
  const stocks = db.prepare('SELECT * FROM stocks ORDER BY name ASC').all();
  res.json(stocks);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const stock = db.prepare('SELECT * FROM stocks WHERE id = ?').get(req.params.id);
  if (!stock) {
    return res.status(404).json({ error: 'Stock not found' });
  }
  res.json(stock);
});

router.post('/', async (req, res) => {
  const { ticker, name, market } = req.body;

  if (!ticker || typeof ticker !== 'string') {
    return res.status(400).json({ error: 'ticker is required' });
  }

  const normalizedTicker = ticker.trim().toUpperCase();
  const validation = await validateTicker(normalizedTicker);

  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM stocks WHERE ticker = ?').get(normalizedTicker);
  if (existing) {
    return res.status(409).json({ error: 'Stock already registered' });
  }

  const stockName = name?.trim() || validation.name;
  const stockMarket = market || validation.market;
  const currency = validation.currency;

  const result = db
    .prepare('INSERT INTO stocks (ticker, name, market, currency) VALUES (?, ?, ?, ?)')
    .run(normalizedTicker, stockName, stockMarket, currency);

  const stock = db.prepare('SELECT * FROM stocks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(stock);
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const stock = db.prepare('SELECT * FROM stocks WHERE id = ?').get(req.params.id);
  if (!stock) {
    return res.status(404).json({ error: 'Stock not found' });
  }

  const txCount = db
    .prepare('SELECT COUNT(*) as count FROM transactions WHERE stock_id = ?')
    .get(stock.id);
  if (txCount.count > 0) {
    return res.status(400).json({ error: 'Cannot delete stock with transactions' });
  }

  db.prepare('DELETE FROM stocks WHERE id = ?').run(stock.id);
  res.json({ success: true });
});

export default router;
