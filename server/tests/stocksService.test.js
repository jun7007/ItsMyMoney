import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initDb, closeDb } from '../src/db/index.js';
import { createStock, listStocks } from '../src/services/stocksService.js';

describe('stocksService', () => {
  beforeEach(() => initDb({ memory: true }));
  afterEach(() => closeDb());

  it('creates stock when Yahoo validation fails (offline fallback)', async () => {
    const result = await createStock(
      { ticker: 'AAPL', name: 'Apple Inc.' },
      {
        validateTickerFn: async () => ({
          valid: false,
          error: 'Failed to get crumb, status 429',
        }),
      },
    );

    expect(result.ok).toBe(true);
    expect(result.stock.ticker).toBe('AAPL');
    expect(result.stock.name).toBe('Apple Inc.');
    expect(result.validationWarning).toContain('429');
    expect(listStocks()).toHaveLength(1);
  });

  it('creates KR stock with format fallback', async () => {
    const result = await createStock(
      { ticker: '005930.KS' },
      { validateTickerFn: async () => ({ valid: false, error: 'network error' }) },
    );

    expect(result.ok).toBe(true);
    expect(result.stock.market).toBe('KR');
    expect(result.stock.currency).toBe('KRW');
  });

  it('rejects invalid ticker format', async () => {
    const result = await createStock({ ticker: 'NOT!!!VALID' });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  it('rejects duplicate ticker', async () => {
    await createStock(
      { ticker: 'MSFT' },
      { validateTickerFn: async () => ({ valid: false, error: 'offline' }) },
    );
    const result = await createStock({ ticker: 'MSFT' });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(409);
  });
});
