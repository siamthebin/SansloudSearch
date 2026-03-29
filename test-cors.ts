import fetch from 'node-fetch';

async function testCors() {
  const res = await fetch('https://google.serper.dev/search', {
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:3000',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'X-API-KEY, Content-Type'
    }
  });
  console.log('CORS Headers:', res.headers.raw());
}
testCors();
