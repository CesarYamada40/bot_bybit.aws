import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [health, setHealth] = useState<any>(null);
  const [ticker, setTicker] = useState<any>(null);
  const [authTest, setAuthTest] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setError(null);
    try {
      const r = await fetch('/health');
      setHealth(await r.json());
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  const fetchTicker = async () => {
    setError(null);
    setLoading(true);
    try {
      const r = await fetch('/api/bybit-proxy?symbol=BTCUSDT');
      setTicker(await r.json());
    } catch (e: any) {
      setTicker({ error: e.message || String(e) });
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthTest = async () => {
    setError(null);
    setLoading(true);
    try {
      const r = await fetch('/bybit-auth-debug');
      setAuthTest(await r.json());
    } catch (e: any) {
      setAuthTest({ error: e.message || String(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: 20 }}>
      <h1>Bot Bybit — Dashboard</h1>
      <p>Serviço: <strong>{window.location.hostname}</strong></p>

      <div style={{ marginTop: 12 }}>
        <button onClick={fetchHealth}>Ver /health</button>
        <button onClick={fetchTicker} disabled={loading} style={{ marginLeft: 8 }}>
          Obter ticker BTC (proxy)
        </button>
        <button onClick={fetchAuthTest} disabled={loading} style={{ marginLeft: 8 }}>
          Teste auth (testnet)
        </button>
      </div>

      {error && <div style={{ color: 'crimson', marginTop: 12 }}>Erro: {error}</div>}

      <div style={{ marginTop: 18 }}>
        <h3>/health</h3>
        <pre style={{ background: '#f5f5f5', padding: 10 }}>{health ? JSON.stringify(health, null, 2) : '— não testado —'}</pre>

        <h3>/api/bybit-proxy?symbol=BTCUSDT</h3>
        <pre style={{ background: '#f5f5f5', padding: 10 }}>{ticker ? JSON.stringify(ticker, null, 2) : '— não consultado —'}</pre>

        <h3>/bybit-auth-debug</h3>
        <pre style={{ background: '#f5f5f5', padding: 10 }}>{authTest ? JSON.stringify(authTest, null, 2) : '— não consultado —'}</pre>
      </div>

      <footer style={{ marginTop: 24, fontSize: 12, color: '#666' }}>
        Lembrete: remova os endpoints temporários ao terminar a verificação.
      </footer>
    </div>
  );
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<App />);
} else {
  console.error('Root element not found: #root');
}
