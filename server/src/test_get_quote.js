import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function test() {
  try {
    const tickers = ['005930.KS', 'AAPL'];
    console.log('Fetching quotes for:', tickers);
    const quotes = await yahooFinance.quote(tickers);
    console.log('Quotes results:', JSON.stringify(quotes, null, 2));
  } catch (err) {
    console.error('Error fetching quotes:', err.message, err.stack);
  }
}
test();
