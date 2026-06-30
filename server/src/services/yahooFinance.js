import { getDb } from '../db/index.js';

const CACHE_TTL = parseInt(process.env.PRICE_CACHE_TTL || '60', 10) * 1000;

function inferMarket(ticker) {
  if (ticker.endsWith('.KS') || ticker.endsWith('.KQ')) return 'KR';
  return 'US';
}

function inferCurrency(ticker, quoteCurrency) {
  if (quoteCurrency) return quoteCurrency;
  return inferMarket(ticker) === 'KR' ? 'KRW' : 'USD';
}

async function fetchNaverKrQuotes(tickers) {
  if (tickers.length === 0) return {};
  try {
    const codes = tickers.map(t => t.split('.')[0]);
    const url = `https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:${codes.join(',')}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Naver Polling API status ${res.status}`);
    
    const data = await res.json();
    const results = {};
    
    const areas = data.result?.areas || [];
    const itemArea = areas.find(a => a.name === 'SERVICE_ITEM');
    const datas = itemArea?.datas || [];
    
    for (const item of datas) {
      const code = item.cd;
      const ticker = tickers.find(t => t.startsWith(code));
      if (!ticker) continue;
      
      results[ticker] = {
        ticker,
        price: item.nv ?? 0,
        changePct: item.cr ?? 0,
        currency: 'KRW',
        updatedAt: new Date(data.result?.time || Date.now()).toISOString(),
      };
    }
    return results;
  } catch (err) {
    console.error('Failed to fetch Naver KR quotes:', err.message);
    return {};
  }
}

async function fetchNaverKrName(ticker) {
  try {
    const code = ticker.split('.')[0];
    const url = `https://m.stock.naver.com/api/stock/${code}/integration`;
    const res = await fetch(url);
    if (res.status === 200) {
      const data = await res.json();
      return data.stockName || ticker;
    }
  } catch (err) {
    // Continue
  }
  return ticker;
}

async function fetchNaverUsQuote(ticker) {
  const suffixes = ['.O', '.N', '.A', ''];
  for (const suffix of suffixes) {
    try {
      const url = `https://api.stock.naver.com/stock/${ticker}${suffix}/basic`;
      const res = await fetch(url);
      if (res.status === 200) {
        const data = await res.json();
        return {
          ticker,
          price: data.closePrice ?? 0,
          changePct: data.fluctuationsRatio ?? 0,
          currency: data.currencyType?.code || 'USD',
          updatedAt: data.localTradedAt ? new Date(data.localTradedAt).toISOString() : new Date().toISOString(),
          name: data.stockNameEng || data.stockName || ticker
        };
      }
    } catch (err) {
      // Continue
    }
  }
  return null;
}

export async function validateTicker(ticker) {
  try {
    const isKR = ticker.endsWith('.KS') || ticker.endsWith('.KQ');
    if (isKR) {
      const krQuotes = await fetchNaverKrQuotes([ticker]);
      const quote = krQuotes[ticker];
      if (!quote) {
        return { valid: false, error: 'Ticker not found or no price data' };
      }
      const name = await fetchNaverKrName(ticker);
      return {
        valid: true,
        name,
        currency: 'KRW',
        market: 'KR',
        price: quote.price,
      };
    } else {
      const quote = await fetchNaverUsQuote(ticker);
      if (!quote) {
        return { valid: false, error: 'Ticker not found or no price data' };
      }
      return {
        valid: true,
        name: quote.name,
        currency: quote.currency,
        market: 'US',
        price: quote.price,
      };
    }
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
    const isKR = ticker.endsWith('.KS') || ticker.endsWith('.KQ');
    let price = 0;
    let changePct = 0;
    let currency = isKR ? 'KRW' : 'USD';
    let updatedAt = new Date().toISOString();

    if (isKR) {
      const krQuotes = await fetchNaverKrQuotes([ticker]);
      const quote = krQuotes[ticker];
      if (quote) {
        price = quote.price;
        changePct = quote.changePct;
        updatedAt = quote.updatedAt;
      }
    } else {
      const quote = await fetchNaverUsQuote(ticker);
      if (quote) {
        price = quote.price;
        changePct = quote.changePct;
        currency = quote.currency;
        updatedAt = quote.updatedAt;
      }
    }

    setCachedQuote(ticker, price, changePct, currency);

    return {
      ticker,
      price,
      changePct,
      currency,
      updatedAt,
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
      const krTickers = uncached.filter(t => t.endsWith('.KS') || t.endsWith('.KQ'));
      const usTickers = uncached.filter(t => !t.endsWith('.KS') && !t.endsWith('.KQ'));

      // Fetch KR quotes
      if (krTickers.length > 0) {
        const krQuotes = await fetchNaverKrQuotes(krTickers);
        for (const ticker of krTickers) {
          const quote = krQuotes[ticker] || { price: 0, changePct: 0, currency: 'KRW', updatedAt: new Date().toISOString() };
          setCachedQuote(ticker, quote.price, quote.changePct, quote.currency);
          results[ticker] = {
            ticker,
            price: quote.price,
            changePct: quote.changePct,
            currency: quote.currency,
            updatedAt: quote.updatedAt,
            cached: false,
          };
        }
      }

      // Fetch US quotes
      if (usTickers.length > 0) {
        const usQuotesList = await Promise.all(usTickers.map(t => fetchNaverUsQuote(t)));
        for (let i = 0; i < usTickers.length; i++) {
          const ticker = usTickers[i];
          const quote = usQuotesList[i] || { price: 0, changePct: 0, currency: 'USD', updatedAt: new Date().toISOString() };
          setCachedQuote(ticker, quote.price, quote.changePct, quote.currency);
          results[ticker] = {
            ticker,
            price: quote.price,
            changePct: quote.changePct,
            currency: quote.currency,
            updatedAt: quote.updatedAt,
            cached: false,
          };
        }
      }
    } catch (err) {
      for (const ticker of uncached) {
        if (!results[ticker]) {
          const isKR = ticker.endsWith('.KS') || ticker.endsWith('.KQ');
          results[ticker] = { ticker, price: 0, changePct: 0, currency: isKR ? 'KRW' : 'USD', error: err.message };
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
