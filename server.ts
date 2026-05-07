import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Simple Free Search Proxy using DuckDuckGo Html
  app.get('/api/search', async (req, res) => {
    try {
      const query = typeof req.query.q === 'string' ? req.query.q : '';
      if (!query) return res.json({ results: [] });
      
      const fetch = (await import('node-fetch')).default;
      const htmlRes = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
        headers: {
          'Origin': 'https://html.duckduckgo.com',
          'Referer': 'https://html.duckduckgo.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
        }
      });
      
      const html = await htmlRes.text();
      
      // More robust parsing for duckduckgo html results
      const results: any[] = [];
      
      // Use a more inclusive regex that finds the result container
      const resultRegex = /<div class="[^"]*result[^"]*"[^>]*>(.*?)<\/div>\s*<\/div>\s*<\/div>/gs;
      const titleRegex = /<a class="result__a" [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/s;
      const snippetRegex = /<a class="result__snippet" [^>]*>(.*?)<\/a>/s;
      
      let match;
      while ((match = resultRegex.exec(html)) !== null) {
        if (results.length >= 10) break;
        const block = match[1];
        
        const titleMatch = block.match(titleRegex);
        if (!titleMatch) continue;
        
        let url = titleMatch[1];
        let title = titleMatch[2].replace(/<\/?[^>]+(>|$)/g, "").trim();
        
        const snippetMatch = block.match(snippetRegex);
        let snippet = snippetMatch ? snippetMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim() : "";

        if (url && url.startsWith('//duckduckgo.com/l/?uddg=')) {
          try {
            const raw = url.split('uddg=')[1].split('&')[0];
            url = decodeURIComponent(raw);
          } catch(e){}
        }
        
        if (url && !url.includes('duckduckgo.com') && title) {
          results.push({ url, title, snippet });
        }
      }

      // If regex failing, try a backup simple paragraph extraction
      if (results.length === 0) {
        const simpleRegex = /<a class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g;
        let sMatch;
        while ((sMatch = simpleRegex.exec(html)) !== null) {
          if (results.length >= 10) break;
          results.push({
            url: sMatch[1].startsWith('//') ? 'https:' + sMatch[1] : sMatch[1],
            title: sMatch[2].replace(/<\/?[^>]+(>|$)/g, "").trim(),
            snippet: ""
          });
        }
      }
      
      console.log(`Search proxy for "${query}" returned ${results.length} results. HTML length: ${html.length}`);
      res.json({ results });
    } catch (e: any) {
      console.error('Search proxy error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
