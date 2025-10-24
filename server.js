const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const fetch = global.fetch || require('node-fetch');

const app = express();
app.use(express.json());

// Função para obter variáveis de ambiente
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

// Função para mascarar chaves
function maskKey(k) {
  if (!k) return '(not set)';
  return k.length > 8 ? `${k.slice(0,4)}...${k.slice(-4)}` : '****';
}

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Proxy público (testnet)
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

// Rota de autenticação Bybit (VERSÃO SIMPLIFICADA)
app.get('/bybit-auth-debug', async (req, res) => {
  try {
    const apiKey = getSecretVar('BYBIT_KEY');
    const apiSecret = getSecretVar('BYBIT_SECRET');

    if (!apiKey || !apiSecret) {
      return res.status(400).json({
        ok: false,
        error: 'BYBIT_KEY or BYBIT_SECRET not configured'
      });
    }

    // Timestamp em milissegundos
    const timestamp = Date.now().toString();

    // Parâmetros obrigatórios
    const accountType = 'UNIFIED';
    const params = { accountType };
    const queryString = new URLSearchParams(params).toString();

    // CORREÇÃO: String de assinatura PADRÃO da Bybit
    const prehash = timestamp + 'GET' + '/v5/account-wallet-balance' + queryString;

    // Debug (ativar com DEBUG_BYBIT=true)
    if (process.env.DEBUG_BYBIT === 'true') {
      console.log('Prehash:', prehash);
      console.log('API Key (masked):', maskKey(apiKey));
    }

    // Gerar assinatura
    const signature = crypto.createHmac('sha256', apiSecret).update(prehash).digest('hex');

    // Construir URL
    const url = `https://api-testnet.bybit.com/v5/account-wallet-balance?${queryString}`;

    // Fazer requisição
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-BAPI-API-KEY': apiKey,
        'X-BAPI-SIGN': signature,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': '10000'
      }
    });

    const data = await response.json();

    return res.status(200).json({
      ok: response.ok,
      httpStatus: response.status,
      key_masked: maskKey(apiKey),
      bybit_url: url,
      prehash: process.env.DEBUG_BYBIT === 'true' ? prehash : undefined,
      response: data
    });
  } catch (err) {
    return res.status(502).json({
      ok: false,
      error: err.message
    });
  }
});

// Start server
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
