// Variáveis necessárias para autenticação
const apiKey = getSecretVar('BYBIT_KEY');
const apiSecret = getSecretVar('BYBIT_SECRET');

// URL do endpoint
const bybitBaseUrl = process.env.BYBIT_BASE_URL || 'https://api-testnet.bybit.com';
const endpointPath = '/v5/account/info';
const url = `${bybitBaseUrl}${endpointPath}`;

// Timestamp e recvWindow
const timestamp = Date.now().toString();
const recvWindow = '5000'; // Janela de recebimento padrão

// String para assinar
const prehash = `${timestamp}${apiKey}${recvWindow}`;
const signature = crypto.createHmac('sha256', apiSecret).update(prehash).digest('hex');

// Fazer a requisição GET ao Bybit
const response = await fetch(url, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'X-BAPI-API-KEY': apiKey,
    'X-BAPI-SIGN': signature,
    'X-BAPI-TIMESTAMP': timestamp,
    'X-BAPI-RECV-WINDOW': recvWindow
  }
});

// Processar a resposta
const responseData = await response.json();
console.log('Resposta da API:', responseData);
