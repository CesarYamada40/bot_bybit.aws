// Debug route — NÃO deixar em produção permanente.
// Coloque este bloco ANTES do bloco que define distDir / app.use(express.static(distDir)).
app.get('/bybit-auth-debug', async (req, res) => {
  try {
    const apiKey = process.env.BYBIT_KEY;
    const apiSecret = process.env.BYBIT_SECRET;
    if (!apiKey || !apiSecret) return res.status(400).json({ ok: false, error: 'BYBIT_KEY or BYBIT_SECRET not configured on server.' });

    const timestamp = Date.now().toString();
    const method = 'GET';
    const requestPath = '/v5/account/wallet-balance';
    const body = '';
    const prehash = timestamp + method + requestPath + body;
    const signature = require('crypto').createHmac('sha256', apiSecret).update(prehash).digest('hex');

    const url = `https://api-testnet.bybit.com${requestPath}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

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

    const status = response.status;
    const statusText = response.statusText;
    // capture headers as plain object (safe)
    const hdrs = {};
    for (const [k, v] of response.headers.entries()) hdrs[k] = v;

    const text = await response.text();

    // Return debug info (no secrets). Do NOT leave this endpoint public permanently.
    return res.status(200).json({
      ok: response.ok,
      httpStatus: status,
      httpStatusText: statusText,
      bybit_url: url,
      response_headers: hdrs,
      response_body_raw: text === '' ? '(empty string)' : text
    });
  } catch (err) {
    const msg = (err && err.name === 'AbortError') ? 'Gateway Timeout: Bybit timed out' : (err instanceof Error ? err.message : String(err));
    return res.status(502).json({ ok: false, error: msg });
  }
});

// Serve static files from dist/ (build output)
const distDir = path.join(process.cwd(), 'dist');
app.use(express.static(distDir));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'), err => {
    if (err) res.status(500).send('Index file not found. Run build first.');
  });
});

app.listen(port, () => console.log(`Server listening on port ${port}`));
