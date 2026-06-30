let krxStocks = [];
let loading = false;
let initialized = false;

export async function initKrxService() {
  if (initialized || loading) return;
  loading = true;
  try {
    console.log('Initializing KRX stock list from KIND...');
    const url = 'http://kind.krx.co.kr/corpgeneral/corpList.do?method=download&searchType=13';
    
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`KIND server returned status ${res.status}`);
    }
    
    const buffer = await res.arrayBuffer();
    const decoder = new TextDecoder('euc-kr');
    const text = decoder.decode(buffer);
    
    const rx = /<tr>([\s\S]*?)<\/tr>/g;
    let match;
    const stocks = [];
    while ((match = rx.exec(text)) !== null) {
      const row = match[1];
      const tds = [];
      const tdRx = /<td\b[^>]*>([\s\S]*?)<\/td>/g;
      let tdMatch;
      while ((tdMatch = tdRx.exec(row)) !== null) {
        tds.push(tdMatch[1].trim());
      }
      if (tds.length >= 3) {
        const name = tds[0];
        const market = tds[1];
        let code = tds[2];
        // Clean code (remove HTML tags and trim)
        code = code.replace(/<[^>]*>/g, '').trim();
        
        let suffix = '';
        if (market.includes('유가')) {
          suffix = '.KS';
        } else if (market.includes('코스닥')) {
          suffix = '.KQ';
        }
        
        if (suffix) {
          stocks.push({
            ticker: code + suffix,
            name,
            market: 'KR',
            currency: 'KRW'
          });
        }
      }
    }
    
    krxStocks = stocks;
    initialized = true;
    console.log(`KRX stock list initialized: ${krxStocks.length} stocks loaded.`);
  } catch (err) {
    console.error('Failed to initialize KRX stock list:', err.message);
  } finally {
    loading = false;
  }
}

export function searchKrxStocks(query) {
  if (!query) return [];
  const lowerQuery = query.toLowerCase();
  return krxStocks.filter(s => 
    s.name.toLowerCase().includes(lowerQuery) || 
    s.ticker.toLowerCase().includes(lowerQuery)
  );
}

export function isKrxServiceInitialized() {
  return initialized;
}
