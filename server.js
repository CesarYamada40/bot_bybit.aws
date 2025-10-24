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

// Função para gerar um UUID (cdn-request-id)
function generateCdnRequestId() {
  return crypto.randomUUID(); // Gera um UUID único para cada requisição
}

// Função para mascarar chaves em logs/resposta
function maskKey(k) {
  if (!k) return '(not set)';
  return k.length > 8 ? `${k.slice(0,4)}...${k.slice(-4)}` : '****';
}

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Proxy público (CORRIGIDO para testnet)
app.get('/api/bybit-proxy', async (req, res) => {
  try {
    const symbol = req.query.symbol || 'BTCUSDT';
    const url = `https://api-testnet.bybit.com/v5/market/tickers?category=linear&symbol=${encodeURIComponent(symbol)}`;
    const r = await fetch(url);
    const json = await r.json();
    res.status(r.status).json(json);
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err) });
  }
});

// Rota de debug para autenticação Bybit (testnet/mainnet configurable)
app.get('/bybit-auth-debug', async (req, res) => {
  try {
    const apiKey = getSecretVar('BYBIT_KEY');
    const apiSecret = getSecretVar('BYBIT_SECRET');

    if (!apiKey || !apiSecret) {
      return res.status(400).json({
        ok: false,
        error: 'BYBIT_KEY or BYBIT_SECRET not configured',
        key_present: !!apiKey,
        secret_present: !!apiSecret,
      });
    }

    // Gera o cdn-request-id
    const cdnRequestId = generateCdnRequestId();

    // Timestamp em milissegundos (string)
    const timestamp = Date.now().toString();
    
    // Valores hardcoded para evitar sobrescrita
    const recvWindow = '5000'; // Valor padrão
    const httpMethod = 'GET';
    const endpointPath = '/v5/account/wallet-balance';

    // Allow overriding accountType via query param for testing (UNIFIED by default)
    const accountType = (req.query.accountType && String(req.query.accountType).toUpperCase()) || 'UNIFIED';

    // Parâmetros obrigatórios
    const params = { accountType };
    const queryString = new URLSearchParams(params).toString();

    // Declarar a string assinada
    const prehash = `${timestamp}${apiKey}${recvWindow}${queryString}`;

    // Gerar assinatura HMAC-SHA256 hex
    const signature = crypto.createHmac('sha256', apiSecret).update(prehash).digest('hex');

    // Debug logs
    console.log('cdn-request-id:', cdnRequestId);
    console.log('String para assinar (prehash):', prehash);
    console.log('Assinatura gerada (signature):', signature);

    // Construção da URL
    const bybitBaseUrl = process.env.BYBIT_BASE_URL || 'https://api-testnet.bybit.com';
    const url = `${bybitBaseUrl}${endpointPath}?${queryString}`;

    // Fazer a requisição ao Bybit
    const response = await fetch(url, {
      method: httpMethod,
      headers: {
        'Content-Type': 'application/json',
        'X-BAPI-API-KEY': apiKey,
        'X-BAPI-SIGN': signature,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': recvWindow,
        'cdn-request-id': cdnRequestId, // Cabeçalho adicionado
      }
    });

    const dataText = await response.text().catch(() => null);
    let parsed;
    try {
      parsed = dataText ? JSON.parse(dataText) : null;
    } catch (e) {
      parsed = { raw: dataText };
    }

    return res.status(200).json({
      ok: response.ok,
      httpStatus: response.status,
      key_masked: maskKey(apiKey),
      bybit_url: url,
      accountType,
      response: parsed
    });
  } catch (err) {
    return res.status(502).json({
      ok: false,
      error: err.message,
      stack: err.stack
    });
  }
});

// Start server
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
