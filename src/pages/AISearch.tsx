import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Book } from '../services/api';

export function AISearch() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredBookId, setHoveredBookId] = useState<number | null>(null);

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
            {results.map((book) => {
              const isHovered = hoveredBookId === book.id;

              return (
              <div
                key={book.id}
                style={{
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 420ms ease',
                  transform: isHovered
                    ? 'perspective(1000px) translateY(-2px) rotateY(3deg)'
                    : 'perspective(1000px) translateY(0) rotateY(0deg)',
                  boxShadow: isHovered ? '0 8px 20px rgba(24, 44, 89, 0.12)' : 'none',
                  borderRadius: '10px',
                }}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/books/${book.id}`)}
                onMouseEnter={() => setHoveredBookId(book.id)}
                onMouseLeave={() => setHoveredBookId(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/books/${book.id}`);
                  }
                }}
              >
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  style={{
                    height: '250px',
                    width: '150px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    transition: 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)',
                    transform: isHovered ? 'scale(1.015)' : 'scale(1)',
                  }}
                />
                <h3 style={{ fontSize: '0.9rem', margin: '0.5rem 0' }}>{book.title}</h3>
                <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>{book.author}</p>
                <p style={{ fontSize: '0.75rem', color: '#999' }}>Műfaj: {book.genre}</p>
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
