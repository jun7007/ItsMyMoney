export function inferMarketFromTicker(ticker) {
  if (ticker.endsWith('.KS') || ticker.endsWith('.KQ')) return 'KR';
  return 'US';
}

export function inferCurrencyFromTicker(ticker) {
  return inferMarketFromTicker(ticker) === 'KR' ? 'KRW' : 'USD';
}

export function isValidTickerFormat(ticker) {
  return /^[A-Z]{1,10}$/.test(ticker) || /^\d{6}\.(KS|KQ)$/.test(ticker);
}

export function normalizeTicker(ticker) {
  return ticker.trim().toUpperCase();
}
