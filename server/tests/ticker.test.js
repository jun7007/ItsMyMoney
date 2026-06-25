import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  inferMarketFromTicker,
  inferCurrencyFromTicker,
  isValidTickerFormat,
  normalizeTicker,
} from '../src/utils/ticker.js';

describe('ticker utils', () => {
  it('normalizes ticker to uppercase', () => {
    expect(normalizeTicker(' aapl ')).toBe('AAPL');
  });

  it('validates US tickers', () => {
    expect(isValidTickerFormat('AAPL')).toBe(true);
    expect(isValidTickerFormat('INVALID.TICKER')).toBe(false);
  });

  it('validates KR tickers', () => {
    expect(isValidTickerFormat('005930.KS')).toBe(true);
    expect(isValidTickerFormat('035720.KQ')).toBe(true);
  });

  it('infers market and currency', () => {
    expect(inferMarketFromTicker('005930.KS')).toBe('KR');
    expect(inferCurrencyFromTicker('005930.KS')).toBe('KRW');
    expect(inferMarketFromTicker('AAPL')).toBe('US');
    expect(inferCurrencyFromTicker('AAPL')).toBe('USD');
  });
});
