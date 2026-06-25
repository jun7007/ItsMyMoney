import { Router } from 'express';
import { getPortfolio } from '../services/portfolio.js';
import { computeHoldings } from '../services/portfolio.js';
import { getDb } from '../db/index.js';
import { getQuote } from '../services/yahooFinance.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const portfolio = await getPortfolio();
    res.json(portfolio);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stock/:id', async (req, res) => {
  try {
    const db = getDb();
    const stock = db.prepare('SELECT * FROM stocks WHERE id = ?').get(req.params.id);
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const { quantity, avgCost, totalCost } = computeHoldings(stock.id);
    const quote = await getQuote(stock.ticker);
    const currentPrice = quote.price || 0;
    const marketValue = quantity * currentPrice;
    const pnl = marketValue - totalCost;
    const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;

    const transactions = db
      .prepare(`
        SELECT t.*, s.ticker, s.name as stock_name, s.currency
        FROM transactions t
        JOIN stocks s ON s.id = t.stock_id
        WHERE t.stock_id = ?
        ORDER BY t.traded_at DESC, t.id DESC
      `)
      .all(stock.id);

    res.json({
      stock,
      quantity,
      avgCost,
      totalCost,
      currentPrice,
      marketValue,
      pnl,
      pnlPct,
      changePct: quote.changePct || 0,
      currency: quote.currency || stock.currency,
      quoteUpdatedAt: quote.updatedAt,
      transactions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
