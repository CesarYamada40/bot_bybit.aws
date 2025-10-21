/* server.js - simple Express server to serve Angular build and proxy Bybit */
const express = require('express');
const path = require('path');
const process = require('process');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/bybit-proxy', async (req, res) => {
  try {
    const symbol = req.query.symbol;
    let url = 'https://api.bybit.com/v5/market/tickers?category=linear';
    if (symbol) url += `&symbol=${encodeURIComponent(String(symbol))}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, { method: 'GET', headers: { 'User-Agent':'TradingBotDashboard/1.0','Accept':'application/json' }, signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) {
      const errorBody = await response.text();
      return res.status(response.status).json({ message: `Bybit returned ${response.status}`, details: errorBody });
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    const msg = error && error.name === 'AbortError' ? 'Gateway Timeout: Bybit timed out' : (error instanceof Error ? error.message : String(error));
    return res.status(502).json({ message: 'Failed to contact Bybit API', details: msg });
  }
});

app.post('/api/gemini-proxy', (req, res) => {
  if (!process.env.API_KEY) return res.status(501).json({ error: 'API_KEY for Gemini not configured on server.' });
  return res.status(200).json({ text: 'Gemini proxy placeholder: API_KEY set but server not configured for genai library.' });
});

const distDir = path.join(process.cwd(), 'dist');
app.use(express.static(distDir));
app.get('*', (req, res) => {
  const indexPath = path.join(distDir, 'index.html');
  res.sendFile(indexPath, err => { if (err) res.status(500).send('Index not found. Run build.'); });
});

app.listen(port, () => console.log(`Server listening on port ${port}`));
