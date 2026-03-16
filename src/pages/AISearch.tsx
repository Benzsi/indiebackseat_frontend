import { useState } from 'react';
import type { Book } from '../services/api';

export function AISearch() {
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Kérjük, írj be egy keresési kifejezést!');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      // AI ajánlás: könyv ID-k lekérése
      const aiResponse = await fetch('http://localhost:3000/ai-filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        throw new Error(`AI feldolgozás sikertelen (${aiResponse.status}): ${errText}`);
      }

      const books: Book[] = await aiResponse.json();
      console.log('AI ajánlott játékok:', books);

      if (!Array.isArray(books) || books.length === 0) {
        setError('Nincs találat a keresésre. Próbálj másik kifejezést!');
        return;
      }

      setResults(books);
    } catch (err: any) {
      console.error('Keresési hiba:', err);
      const errorMessage = err?.response?.error?.details || err?.message || 'Hiba történt a keresés során. Kérjük, próbáld újra!';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
      <h1>AI Játék Ájanló</h1>
      <p>Írd le, hogy milyen játékokat keresel, és az AI segít megtalálni!</p>

      <form onSubmit={handleSearch} style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Pl: CO-OP játék egy rövid délutánra."
            style={{
              flex: 1,
              padding: '0.75rem',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? '🔍 Keresés...' : '🔍 Keresés'}
          </button>
        </div>
      </form>

      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#f8d7da',
            borderRadius: '4px',
            color: '#721c24',
            marginBottom: '2rem',
          }}
        >
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h2>Találatok ({results.length})</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '2rem',
            }}
          >
            {results.map((book) => (
              <div key={book.id} style={{ textAlign: 'center' }}>
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  style={{
                    height: '250px',
                    width: '150px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                  }}
                />
                <h3 style={{ fontSize: '0.9rem', margin: '0.5rem 0' }}>{book.title}</h3>
                <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>{book.author}</p>
                <p style={{ fontSize: '0.75rem', color: '#999' }}>Műfaj: {book.genre}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
