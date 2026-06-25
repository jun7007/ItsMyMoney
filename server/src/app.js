import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ContractIds, sendContract } from 'shared/contracts';
import { pinAuth } from './middleware/pinAuth.js';
import stocksRouter from './routes/stocks.js';
import transactionsRouter from './routes/transactions.js';
import portfolioRouter from './routes/portfolio.js';
import quotesRouter from './routes/quotes.js';
import newsRouter from './routes/news.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(pinAuth);

  app.get('/api/health', (_req, res) => {
    sendContract(res, ContractIds.HEALTH_CHECK, {
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/stocks', stocksRouter);
  app.use('/api/transactions', transactionsRouter);
  app.use('/api/portfolio', portfolioRouter);
  app.use('/api/quotes', quotesRouter);
  app.use('/api/news', newsRouter);

  const clientDist = path.join(__dirname, '../../client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  return app;
}
