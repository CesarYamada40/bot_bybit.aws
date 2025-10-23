# Bot Bybit - Trading Dashboard

Dashboard para monitorar e testar APIs do Bybit com deploy no Render.

![Bot Bybit UI](https://github.com/user-attachments/assets/7fb35f73-d4c8-486a-ad98-17e6c73b7717)

## 🚀 Deploy Rápido no Render

Este projeto está pronto para deploy no Render. Veja o guia completo: [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)

**Comandos para Render:**
- **Build:** `npm install && npm run build`
- **Start:** `npm start`

## 🧪 Teste de API

Execute o script de teste incluído:
```bash
node test-api.js http://localhost:10000
# ou
node test-api.js https://seu-app.onrender.com
```

## 📋 Endpoints Disponíveis

| Endpoint | Descrição |
|----------|-----------|
| `/health` | Health check do servidor |
| `/api/bybit-proxy` | Proxy para dados públicos do Bybit |
| `/bybit-auth-debug` | Teste de autenticação (requer env vars) |

## 🛠️ Desenvolvimento Local

**Pré-requisitos:** Node.js

1. Instalar dependências:
   ```bash
   npm install
   ```

2. Build do projeto:
   ```bash
   npm run build
   ```

3. Iniciar servidor:
   ```bash
   npm start
   ```

4. Ou executar em modo desenvolvimento:
   ```bash
   npm run dev
   ```

## 🔐 Variáveis de Ambiente (Opcional)

Para testar autenticação com Bybit, configure:
- `BYBIT_KEY` - Sua API Key do Bybit
- `BYBIT_SECRET` - Seu API Secret do Bybit

## 📚 Documentação

- [Guia de Deploy no Render](RENDER_DEPLOYMENT.md) - Instruções completas de deployment
- [Script de Teste](test-api.js) - Teste automatizado de endpoints

## ✅ Verificação

O projeto foi verificado e está pronto para:
- ✅ Deploy no Render
- ✅ Testes de API
- ✅ Health checks
- ✅ Proxy de dados públicos do Bybit
- ✅ Autenticação com Bybit (quando configurado)
