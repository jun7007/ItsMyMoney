import { Router } from 'express';
import { getNews } from '../services/yahooFinance.js';

const router = Router();

router.get('/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.trim().toUpperCase();
    const news = await getNews(ticker);
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
