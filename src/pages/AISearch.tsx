import { useState, useEffect } from 'react';
import type { User, Book } from '../services/api';
import { RatingsService } from '../services/api';
import { Sparkles, Search } from 'lucide-react';
import { BookCard } from '../components/BookCard';
import type { BookWithRating } from '../components/BookCard';
import { AddToListModal } from '../components/AddToListModal';
import { getListsForUser, createListForUser, addBookToList } from '../services/lists';
import type { BookList } from '../services/lists';

interface AISearchProps {
  user?: User | null;
}

export function AISearch({ user }: AISearchProps) {
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState<BookWithRating[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredBookId, setHoveredBookId] = useState<number | null>(null);

  // Lista funkciókhoz állapottér (mint a Home-ban)
  const [addListModalOpen, setAddListModalOpen] = useState(false);
  const [lists, setLists] = useState<BookList[]>([]);
  const [selectedBookForList, setSelectedBookForList] = useState<BookWithRating | null>(null);
  
  const ratingsService = new RatingsService();

  useEffect(() => {
    if (user) {
      void loadUserLists(String(user.id));
    }
  }, [user]);

  const loadUserLists = async (userId: string) => {
    const userLists = await getListsForUser(userId);
    setLists(userLists);
  };

  const handleOpenAddList = (book: BookWithRating) => {
    setSelectedBookForList(book);
    setAddListModalOpen(true);
  };

  const handleCloseAddList = () => {
    setAddListModalOpen(false);
    setSelectedBookForList(null);
  };

  const handleAddBookToList = async (listId: number) => {
    if (user && selectedBookForList) {
      try {
        await addBookToList(listId, selectedBookForList.id);
        await loadUserLists(String(user.id));
        setAddListModalOpen(false);
        setSelectedBookForList(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'A könyv listához adása sikertelen');
      }
    }
  };

  const handleCreateList = async (name: string) => {
    if (user) {
      const created = await createListForUser(String(user.id), name);
      if (!created) {
        throw new Error('Lista létrehozása sikertelen');
      }
      await loadUserLists(String(user.id));
    }
  };

  // Kiszámítjuk, hogy történt-e már keresés (van találat, tölt vagy hiba volt)
  const hasSearched = results.length > 0 || loading || error !== '';

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Kérjük, írj be egy keresési kifejezést!');
      return;
    }

    setLoading(true);
    setError('');
    
    // Nem töröljük az eddigi találatokat azonnal, hogy ne pislogjon a képernyő, 
    // csak ha új adat jön, azt majd letöltjük. Vagy ha akarjuk, törölhetjük.
    setResults([]);

    try {
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

      const rawBooks: Book[] = await aiResponse.json();
      console.log('AI ajánlott játékok:', rawBooks);

      if (!Array.isArray(rawBooks) || rawBooks.length === 0) {
        setError('Nincs találat a keresésre. Próbálj másik kifejezést!');
        return;
      }

      // Ratings lekérése ugyanúgy, mint a Home.tsx esetén
      const booksWithRatings = await Promise.all(
        rawBooks.map(async (book) => {
          try {
            const bookRating = await ratingsService.getBookRating(book.id);
            return {
              ...book,
              averageRating: bookRating.averageRating || 0,
              totalRatings: bookRating.totalRatings || 0,
            };
          } catch {
            return {
              ...book,
              averageRating: 0,
              totalRatings: 0,
            };
          }
        })
      );

      setResults(booksWithRatings);
    } catch (err: any) {
      console.error('Keresési hiba:', err);
      const errorMessage = err?.response?.error?.details || err?.message || 'Hiba történt a keresés során. Kérjük, próbáld újra!';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '2rem', height: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>


      {/* Felső tér (Spacer). Ha még nem kerestünk, felülről nyomja le a keresőt középre. Ha kerestünk, ide kerülnek az eredmények. */}
      <div 
        className="ai-scroll-container"
        style={{ 
          flex: 1, 
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)',
          overflowY: hasSearched ? 'auto' : 'hidden', 
          opacity: hasSearched ? 1 : 0, 
          padding: hasSearched ? '0 10px 2rem 10px' : '0', 
          marginBottom: hasSearched ? '1rem' : '0' 
        }}
      >
        
        {/* Hibaüzenet */}
        {error && (
          <div style={{
            padding: '1rem 1.5rem', backgroundColor: '#fde8e8', borderLeft: '4px solid #f98080',
            borderRadius: '8px', color: '#9b1c1c', marginBottom: '2rem', width: '100%',
            fontWeight: 600, boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            animation: 'fadeIn 0.4s ease-out'
          }}>
            {error}
          </div>
        )}

        {/* Eredmény kártyák */}
        {results.length > 0 && (
          <div className="books-grid" style={{
            width: '100%',
            paddingBottom: '2rem',
            animation: 'fadeIn 0.5s ease-out'
          }}>
            {results.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                isHovered={hoveredBookId === book.id}
                onMouseEnter={() => setHoveredBookId(book.id)}
                onMouseLeave={() => setHoveredBookId(null)}
                onOpenAddList={handleOpenAddList}
              />
            ))}
          </div>
        )}
      </div>

      {/* Keresőmező konténer */}
      <div style={{ 
        flexShrink: 0, 
        position: 'relative', 
        zIndex: 10,
        width: '100%',
        maxWidth: hasSearched ? '100%' : '900px',
        margin: '0 auto',
        transform: hasSearched ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)' 
      }}>
        
        {/* Egy hatalmas szép címsor középre, ami eltűnik, amikor a kereső lecsúszik! */}
        <div style={{
          textAlign: 'center',
          transition: 'all 0.5s ease',
          opacity: hasSearched ? 0 : 1,
          height: hasSearched ? '0px' : 'auto',
          marginBottom: hasSearched ? '0px' : '3rem',
          overflow: 'hidden'
        }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '3.5rem', 
            fontWeight: 800, 
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px' 
          }}>
            Válaszd ki a következő játékod!
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--color-secondary)', marginTop: '1rem', fontWeight: 500 }}>
            Írd le egyszerűen milyen hangulathoz keresel valamit.
          </p>
        </div>

        <form onSubmit={handleSearch} style={{ width: '100%' }}>
          <div style={{ 
            position: 'relative', display: 'flex', alignItems: 'center', 
            boxShadow: hasSearched 
              ? '0 -4px 20px rgba(39, 55, 77, 0.06), 0 8px 16px rgba(39, 55, 77, 0.08)' 
              : '0 20px 40px rgba(39, 55, 77, 0.1), 0 8px 16px rgba(39, 55, 77, 0.05)', 
            borderRadius: '999px', background: '#fff',
            border: '2px solid transparent', transition: 'all 0.4s ease'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-accent)'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
          >
            <Sparkles style={{ position: 'absolute', left: '24px', color: 'var(--color-accent)' }} size={24} />
            
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Pl: Adj egy jó sandbox játékot haveroknak..."
              style={{
                flex: 1,
                padding: '1.8rem 1.8rem 1.8rem 60px',
                fontSize: '1.25rem',
                border: 'none',
                borderRadius: '999px',
                outline: 'none',
                background: 'transparent',
                color: 'var(--color-primary)',
              }}
            />
            
            <button
              type="submit"
              disabled={loading}
              style={{
                position: 'absolute',
                right: '10px',
                padding: '1.2rem 2.4rem',
                fontSize: '1.1rem',
                fontWeight: 700,
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '999px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = 'var(--color-secondary)')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = 'var(--color-primary)')}
              onMouseDown={(e) => !loading && (e.currentTarget.style.transform = 'scale(0.96)')}
              onMouseUp={(e) => !loading && (e.currentTarget.style.transform = 'scale(1)')}
            >
              {loading ? (
                <>
                  <Search size={22} className="spinner" style={{ animation: 'neon-spin 2s linear infinite' }} />
                  Keresés...
                </>
              ) : (
                <>
                  <Search size={22} />
                  Keresés
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Alsó tér (Spacer). Ha még nem kerestünk, alulról is nyomja a keresőt középre. Keresés után eltűnik. */}
      <div 
        style={{ 
          flex: hasSearched ? 0 : 1.5, 
          transition: 'all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)' 
        }} 
      />

      {/* Modális ablak a listához adáshoz */}
      <AddToListModal
        isOpen={addListModalOpen}
        onClose={handleCloseAddList}
        onAdd={handleAddBookToList}
        lists={lists}
        bookTitle={selectedBookForList?.title || ''}
        onCreateList={handleCreateList}
      />
    </div>
  );
}
