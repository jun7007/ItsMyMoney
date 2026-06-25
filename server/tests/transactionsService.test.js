import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initDb, closeDb } from '../src/db/index.js';
import { createStock } from '../src/services/stocksService.js';
import {
  createTransaction,
  listTransactions,
  deleteTransaction,
} from '../src/services/transactionsService.js';

const mockValidate = async () => ({ valid: false, error: 'offline' });

async function seedStock(ticker = 'AAPL') {
  const result = await createStock({ ticker, name: ticker }, { validateTickerFn: mockValidate });
  return result.stock;
}

describe('transactionsService', () => {
  beforeEach(() => initDb({ memory: true }));
  afterEach(() => closeDb());

  it('creates BUY transaction', async () => {
    const stock = await seedStock();
    const result = createTransaction({
      stock_id: stock.id,
      type: 'BUY',
      quantity: 5,
      price: 100,
      fee: 1,
      traded_at: '2024-06-01T09:00:00.000Z',
      memo: 'test buy',
    });

    expect(result.ok).toBe(true);
    expect(result.transaction.stock_name).toBe('AAPL');
    expect(listTransactions()).toHaveLength(1);
  });

  it('rejects SELL when insufficient quantity', async () => {
    const stock = await seedStock();
    const result = createTransaction({
      stock_id: stock.id,
      type: 'SELL',
      quantity: 1,
      price: 100,
      traded_at: '2024-06-01T09:00:00.000Z',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Insufficient quantity');
  });

  it('rejects missing required fields', async () => {
    const stock = await seedStock();
    const result = createTransaction({
      stock_id: stock.id,
      type: 'BUY',
      quantity: '',
      price: 100,
      traded_at: '2024-06-01T09:00:00.000Z',
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  it('deletes transaction', async () => {
    const stock = await seedStock();
    const created = createTransaction({
      stock_id: stock.id,
      type: 'BUY',
      quantity: 2,
      price: 50,
      traded_at: '2024-06-01T09:00:00.000Z',
    });

    const deleted = deleteTransaction(created.transaction.id);
    expect(deleted.ok).toBe(true);
    expect(listTransactions()).toHaveLength(0);
  });
});
