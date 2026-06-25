import { Router } from 'express';
import { ContractIds, sendContract, sendContractError } from 'shared/contracts';
import { getNews } from '../services/yahooFinance.js';
import { normalizeTicker } from '../utils/ticker.js';

const router = Router();

router.get('/:ticker', async (req, res) => {
  try {
    const ticker = normalizeTicker(req.params.ticker);
    const news = await getNews(ticker);
    sendContract(res, ContractIds.NEWS_GET, news);
  } catch (err) {
    sendContractError(res, ContractIds.NEWS_GET, err.message, 500);
  }
});

export default router;
