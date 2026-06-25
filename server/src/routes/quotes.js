import { Router } from 'express';
import { getQuote } from '../services/yahooFinance.js';
import { validateTicker } from '../services/yahooFinance.js';

const router = Router();

router.get('/validate/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.trim().toUpperCase();
    const result = await validateTicker(ticker);
    if (!result.valid) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.trim().toUpperCase();
    const quote = await getQuote(ticker);
    res.json(quote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
