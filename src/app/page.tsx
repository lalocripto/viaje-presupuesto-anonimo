'use client';

import { useEffect, useState } from 'react';

type Entry = { id: string; amount: number; created_at: string };

export default function Home() {
  const [amount, setAmount] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadEntries() {
    const res = await fetch('/api/responses');
    const data = await res.json();
    if (res.ok) setEntries(data.entries || []);
  }

  useEffect(() => {
    loadEntries();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const numeric = Number(amount);
    if (!numeric || numeric <= 0) {
      setError('Pon una cantidad válida');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: numeric }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo guardar');
      return;
    }
    setAmount('');
    loadEntries();
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: 40, marginBottom: 24 }}>cuanto me puedo gastar?</h1>

      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        <input
          type="number"
          inputMode="numeric"
          placeholder="Pon una cantidad"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ flex: 1, minWidth: 240, padding: '14px 16px', fontSize: 18, borderRadius: 12, border: '1px solid #ccc' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '14px 18px', fontSize: 18, borderRadius: 12, border: 'none', background: '#111', color: '#fff' }}
        >
          {loading ? 'guardando...' : 'mandar'}
        </button>
      </form>

      {error && <p style={{ color: 'crimson', marginBottom: 16 }}>{error}</p>}

      <div style={{ display: 'grid', gap: 12 }}>
        {entries.map((entry) => (
          <div key={entry.id} style={{ padding: '14px 16px', border: '1px solid #e5e5e5', borderRadius: 12, fontSize: 20 }}>
            amigo anónimo: "{entry.amount}"
          </div>
        ))}
      </div>
    </main>
  );
}
