import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { ContractIds } from 'shared/contracts';
import { initDb, closeDb } from '../src/db/index.js';
import { createApp } from '../src/app.js';

describe('API integration (contract IDs)', () => {
  let app;

  beforeEach(() => {
    initDb({ memory: true });
    app = createApp();
  });

  afterEach(() => closeDb());

  it('health.check returns contract envelope', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.headers['x-contract-id']).toBe(ContractIds.HEALTH_CHECK);
    expect(res.body.contractId).toBe(ContractIds.HEALTH_CHECK);
    expect(res.body.data.status).toBe('ok');
  });

  it('stock create + transaction create flow without Yahoo', async () => {
    const stockRes = await request(app)
      .post('/api/stocks')
      .send({ ticker: 'AAPL', name: 'Apple Inc.' })
      .expect(201);

    expect(stockRes.body.contractId).toBe(ContractIds.STOCKS_CREATE);
    expect(stockRes.body.data.stock.id).toBeDefined();

    const stockId = stockRes.body.data.stock.id;

    const txRes = await request(app)
      .post('/api/transactions')
      .send({
        stock_id: stockId,
        type: 'BUY',
        quantity: 10,
        price: 180.5,
        fee: 0,
        traded_at: '2024-06-01T09:30:00.000Z',
      })
      .expect(201);

    expect(txRes.body.contractId).toBe(ContractIds.TRANSACTIONS_CREATE);
    expect(txRes.body.data.quantity).toBe(10);

    const listRes = await request(app).get('/api/transactions').expect(200);
    expect(listRes.body.contractId).toBe(ContractIds.TRANSACTIONS_LIST);
    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0].stock_name).toBe('Apple Inc.');
  });

  it('transactions.list starts empty', async () => {
    const res = await request(app).get('/api/transactions').expect(200);
    expect(res.body.contractId).toBe(ContractIds.TRANSACTIONS_LIST);
    expect(res.body.data).toEqual([]);
  });
});
