import { getDb } from '../db/index.js';
import { getQuotes } from './yahooFinance.js';

export function computeHoldings(stockId) {
  const db = getDb();
  const transactions = db
    .prepare('SELECT * FROM transactions WHERE stock_id = ? ORDER BY traded_at ASC, id ASC')
    .all(stockId);

  let quantity = 0;
  let totalCost = 0;

  for (const tx of transactions) {
    if (tx.type === 'BUY') {
      totalCost += tx.quantity * tx.price + tx.fee;
      quantity += tx.quantity;
    } else if (tx.type === 'SELL') {
      if (quantity <= 0) continue;
      const avgCost = quantity > 0 ? totalCost / quantity : 0;
      const sellQty = Math.min(tx.quantity, quantity);
      totalCost -= avgCost * sellQty;
      quantity -= sellQty;
    }
  }

  const avgCost = quantity > 0 ? totalCost / quantity : 0;

  return {
    quantity,
    avgCost,
    totalCost: quantity > 0 ? totalCost : 0,
  };
}

export async function getPortfolio() {
  const db = getDb();
  const stocks = db.prepare('SELECT * FROM stocks ORDER BY name ASC').all();
  const holdings = [];
  const tickers = [];

  for (const stock of stocks) {
    const { quantity, avgCost, totalCost } = computeHoldings(stock.id);
    if (quantity <= 0) continue;

    tickers.push(stock.ticker);
    holdings.push({
      stock,
      quantity,
      avgCost,
      totalCost,
    });
  }

  const quotes = tickers.length > 0 ? await getQuotes(tickers) : {};

  let totalValue = 0;
  let totalCost = 0;
  let totalDayChange = 0;

  const items = holdings.map(({ stock, quantity, avgCost, totalCost: cost }) => {
    const quote = quotes[stock.ticker] || { price: 0, changePct: 0, currency: stock.currency };
    const currentPrice = quote.price || 0;
    const marketValue = quantity * currentPrice;
    const pnl = marketValue - cost;
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
    const dayChange = marketValue * ((quote.changePct || 0) / 100);

    totalValue += marketValue;
    totalCost += cost;
    totalDayChange += dayChange;

    return {
      stock,
      quantity,
      avgCost,
      totalCost: cost,
      currentPrice,
      marketValue,
      pnl,
      pnlPct,
      changePct: quote.changePct || 0,
      dayChange,
      currency: quote.currency || stock.currency,
      quoteUpdatedAt: quote.updatedAt || null,
    };
  });

  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  return {
    summary: {
      totalValue,
      totalCost,
      totalPnl,
      totalPnlPct,
      totalDayChange,
      holdingCount: items.length,
    },
    holdings: items,
  };
}
