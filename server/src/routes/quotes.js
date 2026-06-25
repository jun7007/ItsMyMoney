import { Router } from 'express';
import { ContractIds, sendContract, sendContractError } from 'shared/contracts';
import { getQuote, validateTicker } from '../services/yahooFinance.js';
import { normalizeTicker } from '../utils/ticker.js';

const router = Router();

router.get('/validate/:ticker', async (req, res) => {
  try {
    const ticker = normalizeTicker(req.params.ticker);
    const result = await validateTicker(ticker);
    if (!result.valid) {
      return sendContractError(res, ContractIds.QUOTES_VALIDATE, result.error, 400);
    }
    sendContract(res, ContractIds.QUOTES_VALIDATE, result);
  } catch (err) {
    sendContractError(res, ContractIds.QUOTES_VALIDATE, err.message, 500);
  }
});

router.get('/:ticker', async (req, res) => {
  try {
    const ticker = normalizeTicker(req.params.ticker);
    const quote = await getQuote(ticker);
    sendContract(res, ContractIds.QUOTES_GET, quote);
  } catch (err) {
    sendContractError(res, ContractIds.QUOTES_GET, err.message, 500);
  }
});

export default router;
