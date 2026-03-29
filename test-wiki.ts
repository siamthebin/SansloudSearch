import fetch from 'node-fetch';

async function testWiki() {
  const wikiRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=apple&utf8=&format=json&origin=*`);
  const wikiData = await wikiRes.json();
  console.log(wikiData.query.search.length);
}
testWiki();
