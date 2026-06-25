import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDb } from './db/index.js';
import { pinAuth } from './middleware/pinAuth.js';
import { getLocalAddresses } from './utils/network.js';
import stocksRouter from './routes/stocks.js';
import transactionsRouter from './routes/transactions.js';
import portfolioRouter from './routes/portfolio.js';
import quotesRouter from './routes/quotes.js';
import newsRouter from './routes/news.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

initDb();

const app = express();
app.use(cors());
app.use(express.json());
app.use(pinAuth);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
} else {
  console.log('  Note: client/dist not found. Run "npm run build" for production mode.\n');
}

app.listen(PORT, HOST, () => {
  console.log(`\nItsMyMoney server running on port ${PORT}`);
  console.log(`  Local:   http://localhost:${PORT}`);
  const addresses = getLocalAddresses();
  if (addresses.length > 0) {
    console.log('  Network:');
    for (const addr of addresses) {
      console.log(`    http://${addr}:${PORT}`);
    }
  }
  console.log('\n  Use Tailscale IP for remote mobile access (see docs/MOBILE_ACCESS.md)\n');
});
