// server.js - Express server to serve Angular build (dist/) and proxy Bybit API
const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/bybit-proxy', async (req, res) => {
  try {
    const symbol = req.query.symbol;
    let url = 'https://api.bybit.com/v5/market/tickers?category=linear';
    if (symbol) url += `&symbol=${encodeURIComponent(String(symbol))}`;

    // Timeout logic
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
    // do not call clearTimeout here (it was already cleared or will be GC'd)
    const msg = (err && err.name === 'AbortError') ? 'Gateway Timeout: Bybit timed out' : (err instanceof Error ? err.message : String(err));
    return res.status(502).json({ message: 'Failed to contact Bybit API', details: msg });
  }
});

// Serve static files from dist/ (Angular build output)
const distDir = path.join(process.cwd(), 'dist');
app.use(express.static(distDir));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'), err => {
    if (err) res.status(500).send('Index file not found. Run build first.');
  });
});
// Rota temporária e segura para verificar se as chaves BYBIT estão no ambiente.
// NÃO retorna a chave inteira — apenas uma versão mascarada.
// REMOVA esta rota após verificar.
app.get('/bybit-credentials-check', (req, res) => {
  const key = process.env.BYBIT_KEY || '';
  const secret = process.env.BYBIT_SECRET || '';

  if (!key && !secret) {
    return res.status(200).json({ ok: false, reason: 'BYBIT_KEY and BYBIT_SECRET not set' });
  }
  if (!key || !secret) {
    return res.status(200).json({
      ok: false,
      reason: !key ? 'BYBIT_KEY not set' : 'BYBIT_SECRET not set',
      key_masked: key ? (key.length > 8 ? `${key.slice(0,4)}...${key.slice(-4)}` : '****') : undefined
    });
  }

  const mask = s => (s.length > 8 ? `${s.slice(0,4)}...${s.slice(-4)}` : '****');

  return res.status(200).json({
    ok: true,
    key_masked: mask(key),
    secret_masked: mask(secret),
    note: 'This endpoint only confirms presence of credentials. Remove it after verification.'
  });
});

// Endpoint temporário de teste autenticado (APENAS LEITURA) para Bybit Testnet.
// Faz uma requisição GET para /v5/account/wallet-balance no endpoint de testnet.
// NÃO executa ordens. Remova após verificação.
app.get('/bybit-auth-test', async (req, res) => {
  try {
    const apiKey = process.env.BYBIT_KEY;
    const apiSecret = process.env.BYBIT_SECRET;
    if (!apiKey || !apiSecret) return res.status(400).json({ ok: false, error: 'BYBIT_KEY or BYBIT_SECRET not configured on server.' });

    // Assinatura Bybit v5: timestamp + method + requestPath + body
    const timestamp = Date.now().toString();
    const method = 'GET';
    const requestPath = '/v5/account/wallet-balance';
    const body = '';
    const prehash = timestamp + method + requestPath + body;
    const signature = require('crypto').createHmac('sha256', apiSecret).update(prehash).digest('hex');

    const url = `https://api-testnet.bybit.com${requestPath}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-BAPI-API-KEY': apiKey,
        'X-BAPI-SIGN': signature,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': '5000'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

    // Não retorna secrets — apenas resposta e chave mascarada
    const maskedKey = apiKey.length > 8 ? `${apiKey.slice(0,4)}...${apiKey.slice(-4)}` : '****';
    return res.status(response.ok ? 200 : 502).json({ ok: true, key_masked: maskedKey, bybit_response: data });
  } catch (err) {
    const msg = (err && err.name === 'AbortError') ? 'Gateway Timeout: Bybit timed out' : (err instanceof Error ? err.message : String(err));
    return res.status(502).json({ ok: false, error: msg });
  }
});
app.listen(port, () => console.log(`Server listening on port ${port}`));
