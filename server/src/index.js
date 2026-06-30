import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db/index.js';
import { createApp } from './app.js';
import { getLocalAddresses } from './utils/network.js';
import { initKrxService } from './services/krxService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

initDb();
initKrxService();

const app = createApp();

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
