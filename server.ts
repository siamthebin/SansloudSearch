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
      
      // Basic regex parsing for duckduckgo html results
      const results: any[] = [];
      const regex = /<a class="result__url" href="([^"]+)">[^<]+<\/a>.*?<a class="result__snippet[^>]+>(.*?)<\/a>/gs;
      
      let match;
      while ((match = regex.exec(html)) !== null) {
        if (results.length >= 10) break;
        let url = match[1];
        if (url.startsWith('//duckduckgo.com/l/?uddg=')) {
          try {
            const raw = url.split('uddg=')[1].split('&')[0];
            url = decodeURIComponent(raw);
          } catch(e){}
        }
        
        let snippet = match[2].replace(/<\/?[^>]+(>|$)/g, "").trim();
        let titleMatch = html.substring(match.index - 500, match.index).match(/<h2 class="result__title">.*?<a[^>]+>(.*?)<\/a>.*?<\/h2>/s);
        let title = titleMatch ? titleMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim() : url;
        
        if (url && !url.includes('duckduckgo.com')) {
          results.push({ url, title, snippet });
        }
      }
      
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
