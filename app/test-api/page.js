"use client";
import { useState } from 'react';

export default function TestApiPage() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const runSync = async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch('/api/sync-markets', { method: 'POST' });
            const data = await res.json();
            setResult(data);
        } catch (error) {
            setResult({ error: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
            <h1>API Test Playground 🧪</h1>
            <p>Use this page to trigger backend API endpoints manually.</p>

            <div style={{ margin: '2rem 0', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
                <h3>Sync Markets (POST /api/sync-markets)</h3>
                <p>Fetches data from API-Football and populates Supabase markets.</p>
                <button
                    onClick={runSync}
                    disabled={loading}
                    style={{
                        padding: '10px 20px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        background: '#0070f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        fontSize: '1rem'
                    }}
                >
                    {loading ? 'Sending Request...' : 'Trigger Sync'}
                </button>
            </div>

            {result && (
                <div style={{ marginTop: '2rem' }}>
                    <h3>Response:</h3>
                    <pre style={{
                        background: '#f4f4f4',
                        padding: '1rem',
                        borderRadius: '5px',
                        overflowX: 'auto',
                        color: '#333'
                    }}>
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
