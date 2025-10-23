const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const fetch = global.fetch || require('node-fetch');

const app = express();
app.use(express.json());

// Função para obter variáveis de ambiente (ou de arquivo de secrets)
function getSecretVar(name) {
  const raw = process.env[name];
  if (raw && raw.toString().trim()) return raw.toString().trim();
  const filePath = path.join('/etc/secrets', name.toLowerCase());
  try {
    if (fs.existsSync(filePath)) return fs.readFileSync(filePath, 'utf8').trim();
  } catch (e) {
    // ignore
  }
  return '';
}

// Função para mascarar chaves em logs/resposta
function maskKey(k) {
  if (!k) return '(not set)';
  return k.length > 8 ? `${k.slice(0,4)}...${k.slice(-4)}` : '****';
}

// Debug route — TEMPORARY: returns prehash and signature for diagnosis.
app.get('/bybit-auth-debug', async (req, res) => {
  // Variables for debug info
  let prehash, signature;
  
  try {
    const apiKey = getSecretVar('BYBIT_KEY');
    const apiSecret = getSecretVar('BYBIT_SECRET');

    // Allow accountType override via query param, default to UNIFIED
    const accountType = req.query.accountType || 'UNIFIED';
    const params = { accountType };

    // Build request path and query string
    const endpointPath = '/v5/account/wallet-balance';
    const queryString = new URLSearchParams(params).toString();

    // Build prehash: timestamp + httpMethod + endpointPath + queryString (no '?')
    const timestamp = Date.now().toString();
    const httpMethod = 'GET';
    prehash = timestamp + httpMethod + endpointPath + queryString;

    // Create HMAC-SHA256 hex signature
    signature = require('crypto').createHmac('sha256', apiSecret).update(prehash).digest('hex');

    // Get base URL from env var, default to testnet
    const baseUrl = getSecretVar('BYBIT_BASE_URL') || 'https://api-testnet.bybit.com';
    
    // Construct URL with '?' for the actual request
    const url = `${baseUrl}${endpointPath}?${queryString}`;

    // Check if debug mode is enabled
    const debugMode = getSecretVar('DEBUG_BYBIT') === 'true';

    // Log prehash if debug mode is enabled
    if (debugMode) {
      console.log('[DEBUG] Prehash string:', prehash);
      console.log('[DEBUG] Signature:', signature);
    }

    // Escolher URL (testnet por padrão, pode ser sobrescrito com BYBIT_BASE_URL)
    const baseUrl = process.env.BYBIT_BASE_URL || 'https://api-testnet.bybit.com';
    const url = `${baseUrl}${endpointPath}?${queryString}`;

    // Fazer a requisição ao Bybit
    const response = await fetch(url, {
      method: httpMethod,
      headers: {
        'Content-Type': 'application/json',
        'X-BAPI-API-KEY': apiKey,
        'X-BAPI-SIGN': signature,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': '10000'
      },
      signal: controller.signal
    });

    const dataText = await response.text().catch(() => null);
    let parsed;
    try {
      parsed = dataText ? JSON.parse(dataText) : null;
    } catch (e) {
      parsed = { raw: dataText };
    }

    const hdrs = {};
    for (const [k, v] of response.headers.entries()) hdrs[k] = v;
    const text = await response.text();

    // Build response object
    const responseData = {
      ok: response.ok,
      httpStatus: response.status,
      httpStatusText: response.statusText,
      key_masked: maskKey(apiKey),
      bybit_url: url,
      response_headers: hdrs,
      response_body_raw: text === '' ? '(empty string)' : text
    };

    // Only include prehash and signature if DEBUG_BYBIT is true
    if (debugMode) {
      responseData.prehash = prehash;
      responseData.signature = signature;
    }

    return res.status(200).json(responseData);
  } catch (err) {
    const msg = (err && err.name === 'AbortError') ? 'Gateway Timeout: Bybit timed out' : (err instanceof Error ? err.message : String(err));
    
    // Include debug info in error response if DEBUG_BYBIT is enabled
    const debugMode = getSecretVar('DEBUG_BYBIT') === 'true';
    const errorResponse = { ok: false, error: msg };
    
    if (debugMode && prehash && signature) {
      errorResponse.prehash = prehash;
      errorResponse.signature = signature;
    }
    
    return res.status(502).json(errorResponse);
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Proxy público usando BYBIT_BASE_URL (default testnet)
app.get('/api/bybit-proxy', async (req, res) => {
  try {
    const symbol = req.query.symbol;
    const baseUrl = getSecretVar('BYBIT_BASE_URL') || 'https://api-testnet.bybit.com';
    let url = `${baseUrl}/v5/market/tickers?category=linear`;
    if (symbol) url += `&symbol=${encodeURIComponent(String(symbol))}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'TradingBotDashboard/1.0', 'Accept': 'application/json' },
      signal: controller.signal
    });
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
console.log('BYBIT_BASE_URL:', getSecretVar('BYBIT_BASE_URL') || 'https://api-testnet.bybit.com (default)');
console.log('DEBUG_BYBIT:', getSecretVar('DEBUG_BYBIT') === 'true' ? 'enabled' : 'disabled');

app.listen(port, () => console.log(`Server listening on port ${port}`));
