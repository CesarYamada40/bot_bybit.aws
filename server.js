// server.js - Express server to serve build (dist/) and proxy Bybit API
const express = require('express');
const path = require('path');
const process = require('process');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;

app.use(express.json());

// Helper to read secret from env or from /etc/secrets/<name> (if present on Render)
function getSecretVar(name) {
  const raw = process.env[name];
  if (raw && raw.toString().trim()) return raw.toString().trim();
  const filePath = `/etc/secrets/${name.toLowerCase()}`;
  try {
    if (fs.existsSync(filePath)) return fs.readFileSync(filePath, 'utf8').trim();
  } catch (e) {
    // ignore
  }
  return '';
}

// Safe masked display for logs (do not print secrets)
function maskKey(k) {
  if (!k) return '(not set)';
  return k.length > 8 ? `${k.slice(0,4)}...${k.slice(-4)}` : '****';
}

// Debug route — TEMPORARY: returns prehash and signature for diagnosis.
app.get('/bybit-auth-debug', async (req, res) => {
  try {
    const apiKey = getSecretVar('BYBIT_KEY');
    const apiSecret = getSecretVar('BYBIT_SECRET');
    if (!apiKey || !apiSecret) return res.status(400).json({ ok: false, error: 'BYBIT_KEY or BYBIT_SECRET not configured on server.' });

    // Required param for this endpoint
    const params = { accountType: 'UNIFIED' };

    // Build request path and query string
    const requestPath = '/v5/account/wallet-balance';
    const queryString = new URLSearchParams(params).toString();

    // CORREÇÃO: String de assinatura SEM o '?' 
    const timestamp = Date.now().toString();
    const method = 'GET';
    const prehash = timestamp + method + requestPath + queryString; // REMOVIDO o '?' e body

    // Create HMAC-SHA256 hex signature
    const signature = require('crypto').createHmac('sha256', apiSecret).update(prehash).digest('hex');

    // CORREÇÃO: Construir URL com o '?' 
    const url = `https://api-testnet.bybit.com${requestPath}?${queryString}`;

    // CORREÇÃO: Timeout aumentado para 10 segundos
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-BAPI-API-KEY': apiKey,
        'X-BAPI-SIGN': signature,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': '10000' // Aumentado para 10 segundos
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    const hdrs = {};
    for (const [k, v] of response.headers.entries()) hdrs[k] = v;
    const text = await response.text();

    return res.status(200).json({
      ok: response.ok,
      httpStatus: response.status,
      httpStatusText: response.statusText,
      prehash,
      signature,
      key_masked: maskKey(apiKey),
      bybit_url: url,
      response_headers: hdrs,
      response_body_raw: text === '' ? '(empty string)' : text
    });
  } catch (err) {
    const msg = (err && err.name === 'AbortError') ? 'Gateway Timeout: Bybit timed out' : (err instanceof Error ? err.message : String(err));
    return res.status(502).json({ ok: false, error: msg });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// CORREÇÃO: Proxy público usando testnet
app.get('/api/bybit-proxy', async (req, res) => {
  try {
    const symbol = req.query.symbol;
    // ALTERADO para testnet
    let url = 'https://api-testnet.bybit.com/v5/market/tickers?category=linear';
    if (symbol) url += `&symbol=${encodeURIComponent(String(symbol))}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'TradingBotDashboard/1.0', 'Accept': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.text();
      return res.status(response.status).json({ message: `Bybit returned ${response.status}`, details: body });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    const msg = (err && err.name === 'AbortError') ? 'Gateway Timeout: Bybit timed out' : (err instanceof Error ? err.message : String(err));
    return res.status(502).json({ message: 'Failed to contact Bybit API', details: msg });
  }
});

// Serve static files from dist/
const distDir = path.join(process.cwd(), 'dist');
app.use(express.static(distDir));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'), err => {
    if (err) res.status(500).send('Index file not found. Run build first.');
  });
});

// Safe startup logs (do NOT print secrets)
console.log('BYBIT_KEY present?', !!getSecretVar('BYBIT_KEY'));
console.log('BYBIT_SECRET present?', !!getSecretVar('BYBIT_SECRET'));

app.listen(port, () => console.log(`Server listening on port ${port}`));
