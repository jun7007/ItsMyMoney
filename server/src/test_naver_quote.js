async function test() {
  try {
    const ticker = '005930';
    const url = `https://api.stock.naver.com/stock/${ticker}/basic`;
    const res = await fetch(url);
    const data = await res.json();
    console.log('Naver quote status:', res.status);
    console.log('Naver quote data:', JSON.stringify(data, null, 2).slice(0, 1000));
  } catch (err) {
    console.error('Error fetching Naver quote:', err);
  }
}
test();
