async function test() {
  try {
    const url = 'http://kind.krx.co.kr/corpgeneral/corpList.do?method=download&searchType=13';
    const res = await fetch(url);
    const text = await res.text();
    console.log('Length of response:', text.length);
    console.log('First 500 chars:', text.slice(0, 500));
  } catch (err) {
    console.error(err);
  }
}
test();
