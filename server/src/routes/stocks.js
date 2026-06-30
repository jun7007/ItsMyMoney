import { Router } from 'express';
import { ContractIds, sendContract, sendContractError } from 'shared/contracts';
import { listStocks, getStockById, createStock, deleteStock } from '../services/stocksService.js';
import { searchKrxStocks } from '../services/krxService.js';

const router = Router();

router.get('/', (_req, res) => {
  sendContract(res, ContractIds.STOCKS_LIST, listStocks());
});

router.get('/search', async (req, res) => {
  const query = req.query.q || '';
  if (!query) {
    return sendContract(res, ContractIds.STOCKS_SEARCH, []);
  }

  try {
    const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(query);
    let results = [];

    // Always search local KRX list first
    const krxResults = searchKrxStocks(query);
    results = [...krxResults];

    if (!hasKorean) {
      // If it's English/number, search Yahoo Finance too
      try {
        const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&newsCount=0`;
        const yfRes = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        if (yfRes.ok) {
          const data = await yfRes.json();
          const quotes = data.quotes || [];
          
          const yfResults = quotes
            .filter(item => item.quoteType === 'EQUITY' || item.quoteType === 'ETF')
            .map(item => {
              const isKR = item.symbol.endsWith('.KS') || item.symbol.endsWith('.KQ');
              return {
                ticker: item.symbol,
                name: item.shortname || item.longname || item.symbol,
                market: isKR ? 'KR' : 'US',
                currency: isKR ? 'KRW' : 'USD',
              };
            });

          // Merge and deduplicate by ticker
          const tickers = new Set(results.map(r => r.ticker));
          for (const item of yfResults) {
            if (!tickers.has(item.ticker)) {
              results.push(item);
              tickers.add(item.ticker);
            }
          }
        }
      } catch (yfErr) {
        console.error('Yahoo Finance search failed:', yfErr.message);
      }
    }

    sendContract(res, ContractIds.STOCKS_SEARCH, results);
  } catch (err) {
    sendContractError(res, ContractIds.STOCKS_SEARCH, err.message, 500);
  }
});

router.get('/:id', (req, res) => {
  const stock = getStockById(req.params.id);
  if (!stock) {
    return sendContractError(res, ContractIds.STOCKS_GET, 'Stock not found', 404);
  }
  sendContract(res, ContractIds.STOCKS_GET, stock);
});

router.post('/', async (req, res) => {
  const result = await createStock(req.body);
  if (!result.ok) {
    return sendContractError(res, ContractIds.STOCKS_CREATE, result.error, result.status);
  }
  sendContract(
    res,
    ContractIds.STOCKS_CREATE,
    { stock: result.stock, validationWarning: result.validationWarning },
    201,
  );
});

router.delete('/:id', (req, res) => {
  const result = deleteStock(req.params.id);
  if (!result.ok) {
    return sendContractError(res, ContractIds.STOCKS_DELETE, result.error, result.status);
  }
  sendContract(res, ContractIds.STOCKS_DELETE, { success: true });
});

export default router;
