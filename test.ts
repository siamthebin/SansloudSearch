import fetch from 'node-fetch';

async function test() {
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': '8eb3b36eaebc77d5d951cb868e6a545fa253403c',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ q: 'apple' })
  });
  console.log(res.status);
  console.log(await res.text());
}
test();
