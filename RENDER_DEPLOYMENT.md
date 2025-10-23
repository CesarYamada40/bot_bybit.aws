# Bot Bybit - Render Deployment Guide

Este guia explica como fazer o deploy do Bot Bybit no Render e como testar a API.

## 📋 Pré-requisitos

- Conta no [Render](https://render.com)
- Chaves da API Bybit (testnet ou production)
- Node.js instalado localmente (para testes)

## 🚀 Deploy no Render

### 1. Criar Web Service no Render

1. Acesse o [Render Dashboard](https://dashboard.render.com/)
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório GitHub
4. Configure o serviço:

   **Build Command:**
   ```
   npm install && npm run build
   ```

   **Start Command:**
   ```
   npm start
   ```

   **Environment:**
   - Node

### 2. Configurar Variáveis de Ambiente

No painel do Render, adicione as seguintes variáveis de ambiente:

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `BYBIT_KEY` | Sua API Key do Bybit | Não* |
| `BYBIT_SECRET` | Seu API Secret do Bybit | Não* |
| `PORT` | Porta do servidor (Render define automaticamente) | Não |

> *Necessário apenas para testar autenticação com Bybit. Os endpoints públicos funcionam sem estas variáveis.

### 3. Deploy

1. Clique em "Create Web Service"
2. Aguarde o build e deploy (geralmente 2-5 minutos)
3. Render fornecerá uma URL como: `https://seu-app.onrender.com`

## 🧪 Testar a API

### Teste Manual via Browser

Acesse sua URL do Render:
```
https://seu-app.onrender.com
```

Use a interface web para testar os endpoints:
- Clique em "Ver /health" para verificar se o servidor está online
- Clique em "Obter ticker BTC (proxy)" para testar a API pública do Bybit
- Clique em "Teste auth (testnet)" para testar autenticação (requer BYBIT_KEY/SECRET)

### Teste via Script Automatizado

Use o script de teste incluído no projeto:

```bash
# Localmente
node test-api.js http://localhost:10000

# No Render
node test-api.js https://seu-app.onrender.com
```

### Teste via cURL

```bash
# Health check
curl https://seu-app.onrender.com/health

# Bybit public market data
curl "https://seu-app.onrender.com/api/bybit-proxy?symbol=BTCUSDT"

# Bybit auth debug (requer env vars)
curl https://seu-app.onrender.com/bybit-auth-debug
```

## 📊 Endpoints Disponíveis

| Endpoint | Método | Descrição | Requer Auth |
|----------|--------|-----------|-------------|
| `/health` | GET | Health check do servidor | Não |
| `/api/bybit-proxy` | GET | Proxy para dados públicos do Bybit | Não |
| `/bybit-auth-debug` | GET | Teste de autenticação com Bybit | Sim |

### Detalhes dos Endpoints

#### `/health`
Verifica se o servidor está online.

**Resposta:**
```json
{
  "status": "ok"
}
```

#### `/api/bybit-proxy?symbol=BTCUSDT`
Retorna dados de mercado do Bybit para o símbolo especificado.

**Parâmetros:**
- `symbol` (opcional): Símbolo do par de trading (ex: BTCUSDT)

**Resposta de sucesso:**
```json
{
  "retCode": 0,
  "retMsg": "OK",
  "result": {
    "list": [...]
  }
}
```

#### `/bybit-auth-debug`
Testa autenticação com a API do Bybit (testnet).

**Requer:** Variáveis `BYBIT_KEY` e `BYBIT_SECRET` configuradas

**Resposta de sucesso:**
```json
{
  "ok": true,
  "httpStatus": 200,
  "key_masked": "abc1...xyz9",
  "bybit_url": "https://api-testnet.bybit.com/v5/account/wallet-balance",
  "response_body_raw": "{...}"
}
```

**Resposta de erro (sem credenciais):**
```json
{
  "ok": false,
  "error": "BYBIT_KEY or BYBIT_SECRET not configured on server."
}
```

## 🔒 Segurança

- **NUNCA** commit suas chaves da API no código
- Use as variáveis de ambiente do Render para armazenar secrets
- O endpoint `/bybit-auth-debug` deve ser removido em produção
- As chaves são mascaradas nos logs (`abc1...xyz9`)

## 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar servidor de produção
npm start

# Testar API
node test-api.js http://localhost:10000
```

## 📝 Estrutura do Projeto

```
bot_bybit.aws/
├── server.js              # Servidor Express (API backend)
├── index.tsx              # App React (frontend)
├── index.html             # HTML base
├── vite.config.ts         # Configuração Vite
├── package.json           # Dependências
├── test-api.js            # Script de teste da API
└── dist/                  # Build de produção (gerado)
```

## ⚠️ Troubleshooting

### Build falha no Render
- Verifique se `package.json` tem todas as dependências listadas
- Certifique-se de que o build command está correto: `npm install && npm run build`

### Endpoints retornam 404
- Verifique se o build foi executado (`dist/` deve existir)
- Confirme que o start command é `npm start`

### Erro "BYBIT_KEY not configured"
- Adicione as variáveis `BYBIT_KEY` e `BYBIT_SECRET` no painel do Render
- Aguarde o redeploy automático após adicionar as variáveis

### API do Bybit não responde
- Verifique se o Render pode acessar APIs externas
- Teste com o endpoint público primeiro (`/api/bybit-proxy`)
- Verifique se suas credenciais do Bybit estão corretas (se usando auth)

## 📞 Suporte

Para problemas específicos do Render:
- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)

Para problemas da API Bybit:
- [Bybit API Documentation](https://bybit-exchange.github.io/docs/v5/intro)

## ✅ Checklist de Deploy

- [ ] Repositório conectado ao Render
- [ ] Build command configurado: `npm install && npm run build`
- [ ] Start command configurado: `npm start`
- [ ] Variáveis de ambiente adicionadas (se necessário)
- [ ] Deploy concluído com sucesso
- [ ] `/health` retorna status OK
- [ ] API pública testada
- [ ] Interface web acessível
- [ ] Testes automatizados executados

---

🎉 **Seu Bot Bybit está pronto para usar no Render!**
