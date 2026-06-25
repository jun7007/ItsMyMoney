import YahooFinance from 'yahoo-finance2';
import { getDb } from '../db/index.js';

const yahooFinance = new YahooFinance();
const CACHE_TTL = parseInt(process.env.PRICE_CACHE_TTL || '60', 10) * 1000;

function inferMarket(ticker) {
  if (ticker.endsWith('.KS') || ticker.endsWith('.KQ')) return 'KR';
  return 'US';
}

function inferCurrency(ticker, quoteCurrency) {
  if (quoteCurrency) return quoteCurrency;
  return inferMarket(ticker) === 'KR' ? 'KRW' : 'USD';
}

export async function validateTicker(ticker) {
  try {
    const quote = await yahooFinance.quote(ticker);
    if (!quote || quote.regularMarketPrice == null) {
      return { valid: false, error: 'Ticker not found or no price data' };
    }
    return {
      valid: true,
      name: quote.shortName || quote.longName || ticker,
      currency: inferCurrency(ticker, quote.currency),
      market: inferMarket(ticker),
      price: quote.regularMarketPrice,
    };
  } catch (err) {
    return { valid: false, error: err.message || 'Failed to validate ticker' };
  }
}

function getCachedQuote(ticker) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM price_cache WHERE ticker = ?').get(ticker);
  if (!row) return null;

  const age = Date.now() - new Date(row.updated_at).getTime();
  if (age > CACHE_TTL) return null;

  return {
    ticker,
    price: row.price,
    changePct: row.change_pct,
    currency: row.currency,
    updatedAt: row.updated_at,
    cached: true,
  };
}

function setCachedQuote(ticker, price, changePct, currency) {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO price_cache (ticker, price, change_pct, currency, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(ticker) DO UPDATE SET
      price = excluded.price,
      change_pct = excluded.change_pct,
      currency = excluded.currency,
      updated_at = excluded.updated_at
  `).run(ticker, price, changePct, currency, now);
}

export async function getQuote(ticker) {
  const cached = getCachedQuote(ticker);
  if (cached) return cached;

  try {
    const quote = await yahooFinance.quote(ticker);
    const price = quote.regularMarketPrice ?? 0;
    const changePct = quote.regularMarketChangePercent ?? 0;
    const currency = inferCurrency(ticker, quote.currency);

    setCachedQuote(ticker, price, changePct, currency);

    return {
      ticker,
      price,
      changePct,
      currency,
      updatedAt: new Date().toISOString(),
      cached: false,
    };
  } catch (err) {
    throw new Error(`Failed to fetch quote for ${ticker}: ${err.message}`);
  }
}

export async function getQuotes(tickers) {
  const results = {};
  const uncached = [];

  for (const ticker of tickers) {
    const cached = getCachedQuote(ticker);
    if (cached) {
      results[ticker] = cached;
    } else {
      uncached.push(ticker);
    }
  }

  if (uncached.length > 0) {
    try {
      const quotes = await yahooFinance.quote(uncached);
      const quoteList = Array.isArray(quotes) ? quotes : [quotes];

      for (const quote of quoteList) {
        const ticker = quote.symbol;
        const price = quote.regularMarketPrice ?? 0;
        const changePct = quote.regularMarketChangePercent ?? 0;
        const currency = inferCurrency(ticker, quote.currency);

        setCachedQuote(ticker, price, changePct, currency);
        results[ticker] = {
          ticker,
          price,
          changePct,
          currency,
          updatedAt: new Date().toISOString(),
          cached: false,
        };
      }
    } catch (err) {
      for (const ticker of uncached) {
        if (!results[ticker]) {
          results[ticker] = { ticker, price: 0, changePct: 0, error: err.message };
        }
      }
    }
  }

  return results;
}

export async function getNews(ticker) {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&newsCount=15`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ItsMyMoney/1.0)',
      },
    });

    if (!res.ok) {
      throw new Error(`Yahoo search API returned ${res.status}`);
    }

    const data = await res.json();
    const news = (data.news || []).map((item) => ({
      title: item.title,
      publisher: item.publisher,
      link: item.link,
      publishedAt: item.providerPublishTime
        ? new Date(item.providerPublishTime * 1000).toISOString()
        : null,
      thumbnail: item.thumbnail?.resolutions?.[0]?.url || null,
    }));
    return news;
  } catch (err) {
    throw new Error(`Failed to fetch news for ${ticker}: ${err.message}`);
  }
}
