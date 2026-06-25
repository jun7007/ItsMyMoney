import { Router } from 'express';
import { ContractIds, sendContract, sendContractError } from 'shared/contracts';
import { getPortfolio } from '../services/portfolio.js';
import { computeHoldings } from '../services/portfolio.js';
import { getStockById } from '../services/stocksService.js';
import { listTransactions } from '../services/transactionsService.js';
import { getQuote } from '../services/yahooFinance.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const portfolio = await getPortfolio();
    sendContract(res, ContractIds.PORTFOLIO_GET, portfolio);
  } catch (err) {
    sendContractError(res, ContractIds.PORTFOLIO_GET, err.message, 500);
  }
});

router.get('/stock/:id', async (req, res) => {
  try {
    const stock = getStockById(req.params.id);
    if (!stock) {
      return sendContractError(res, ContractIds.PORTFOLIO_STOCK_DETAIL, 'Stock not found', 404);
    }

    const { quantity, avgCost, totalCost } = computeHoldings(stock.id);
    const quote = await getQuote(stock.ticker);
    const currentPrice = quote.price || 0;
    const marketValue = quantity * currentPrice;
    const pnl = marketValue - totalCost;
    const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;

    const transactions = listTransactions({ stock_id: stock.id });

    sendContract(res, ContractIds.PORTFOLIO_STOCK_DETAIL, {
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
    sendContractError(res, ContractIds.PORTFOLIO_STOCK_DETAIL, err.message, 500);
  }
});

export default router;
