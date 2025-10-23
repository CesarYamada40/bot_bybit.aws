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

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Exemplo de proxy público (mantém o comportamento existente)
app.get('/api/bybit-proxy', async (req, res) => {
  try {
    const symbol = req.query.symbol || 'BTCUSDT';
    const url = `https://api.bybit.com/v5/market/tickers?category=linear&symbol=${encodeURIComponent(symbol)}`;
    const r = await fetch(url);
    const json = await r.json();
    res.status(r.status).json(json);
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err) });
  }
});

// Rota de debug para autenticação Bybit (testnet)
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

    // Timestamp em milissegundos (string)
    const timestamp = Date.now().toString();
    const method = 'GET';
    const requestPath = '/v5/account/wallet-balance';

    // Parâmetros obrigatórios (NUNCA incluir timestamp na query string usada para assinar)
    const params = {
      accountType: 'UNIFIED'
    };

    // Construir queryString (ordenada por URLSearchParams)
    const queryString = new URLSearchParams(params).toString(); // e.g. accountType=UNIFIED

    // String para assinar: timestamp + method + path + queryString
    // Se não houver queryString, assinar sem ela (concatenando vazio)
    const prehash = timestamp + method + requestPath + (queryString ? queryString : '');

    // Opcional: log para depuração (remova em produção)
    // console.log('String para assinar:', prehash);

    // Gerar assinatura HMAC-SHA256 hex
    const signature = crypto.createHmac('sha256', apiSecret).update(prehash).digest('hex');

    // Escolher URL (testnet) - ajuste conforme ambiente se quiser mainnet
    const baseUrl = 'https://api-testnet.bybit.com';
    const url = `${baseUrl}${requestPath}?${queryString}`;

    // Fazer a requisição ao Bybit
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-BAPI-API-KEY': apiKey,
        'X-BAPI-SIGN': signature,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': '10000'
      }
    });

    const data = await response.text().catch(() => null);
    let parsed;
    try {
      parsed = data ? JSON.parse(data) : null;
    } catch (e) {
      // se Bybit retornou HTML ou texto, manter raw
      parsed = { raw: data };
    }

    return res.status(200).json({
      ok: response.ok,
      httpStatus: response.status,
      key_masked: maskKey(apiKey),
      bybit_url: url,
      signed_string: prehash, // útil para debug — remova em produção
      signature,
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