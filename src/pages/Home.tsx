import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Filter, Star, RotateCcw } from 'lucide-react';
import type { User } from '../services/api';
import { BooksService, RatingsService } from '../services/api';
import { BookCard } from '../components/BookCard';
import type { BookWithRating } from '../components/BookCard';
import { AddToListModal } from '../components/AddToListModal';
import { getListsForUser, createListForUser, addBookToList } from '../services/lists';
import type { BookList } from '../services/lists';

interface HomeProps {
  user?: User | null;
  searchQuery?: string;
}

export function Home({ user, searchQuery = '' }: HomeProps) {
  const [books, setBooks] = useState<BookWithRating[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Összes');
  const [selectedMode, setSelectedMode] = useState<string>('Összes');
  const [selectedRating, setSelectedRating] = useState<string>('');
  const [hoveredBookId, setHoveredBookId] = useState<number | null>(null);
  const [addListModalOpen, setAddListModalOpen] = useState(false);
  const [lists, setLists] = useState<BookList[]>([]);
  const [selectedBookForList, setSelectedBookForList] = useState<BookWithRating | null>(null);
  const [isModesOpen, setIsModesOpen] = useState(false);

  const categories = ['Összes', 'ADVENTURE', 'SANDBOX', 'PLATFORMER', 'PUZZLE', 'ACTION', 'RPG', 'HORROR'];
  const modes = ['Összes', 'SINGLE_PLAYER', 'CO_OP', 'MULTIPLAYER'];

  const booksService = new BooksService();
  const ratingsService = new RatingsService();

  useEffect(() => {
    if (user) {
      void fetchBooks();
      void loadUserLists(String(user.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadUserLists = async (userId: string) => {
    const userLists = await getListsForUser(userId);
    setLists(userLists);
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const data = await booksService.getAllBooks();

      const booksWithRatings = await Promise.all(
        data.map(async (book) => {
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

      setBooks(booksWithRatings);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Könyvek lekérése sikertelen');
    } finally {
      setLoading(false);
    }
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

  const normalizeForSearch = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const normalizedQuery = normalizeForSearch(searchQuery.trim());

  const filteredBooks = books.filter((book) => {
    const categoryMatch = selectedCategory === 'Összes' || book.genre === selectedCategory;
    if (!categoryMatch) return false;

    const modeMatch = selectedMode === 'Összes' || book.literaryForm === selectedMode;
    if (!modeMatch) return false;

    if (selectedRating !== '') {
      const avg = book.averageRating || 0;
      if (selectedRating === '4-5' && (avg < 4 || avg > 5)) return false;
      if (selectedRating === '3-4' && (avg < 3 || avg >= 4)) return false;
      if (selectedRating === '2-3' && (avg < 2 || avg >= 3)) return false;
      if (selectedRating === '1-2' && (avg < 1 || avg >= 2)) return false;
    }

    if (!normalizedQuery) return true;

    return [book.title, book.author, book.genre, book.literaryForm]
      .some((field) => {
        const normalized = normalizeForSearch(field ?? '');
        return normalized.split(/\s+/).some(word => word.startsWith(normalizedQuery));
      });
  });

  if (!user) {
    return (
      <div className="home">
        <h1>indie.backseat</h1>
        <p>
          Fedezd fel a világ legszebb könyveit, ossz meg ajánlásokat az olvasók
          közösségével, és építsd ki saját könyvtáradat.
        </p>
        <div className="home-buttons">
          <Link to="/register" className="btn-primary">
            Első lépések
          </Link>
          <a href="#about" className="btn-primary" style={{ backgroundColor: '#764ba2' }}>
            Tudj meg többet
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="home-authenticated">
      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '24px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #cbd5e1' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, color: 'var(--color-primary)', marginRight: '8px', fontSize: '18px' }}>Játékok:</span>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  border: selectedCategory === cat ? '1.5px solid transparent' : '1.5px solid #cbd5e1',
                  background: selectedCategory === cat ? 'var(--color-primary)' : '#fff',
                  color: selectedCategory === cat ? '#fff' : '#27374D',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          <Link to="/devlogs" className="devlogs-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
            Dev Logs
          </Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-1px' }}>
           <button
             onClick={() => setIsModesOpen(!isModesOpen)}
             title="További szűrők"
             style={{
               background: '#fff',
               border: '1px solid #cbd5e1',
               borderTop: '1px solid #fff',
               padding: '2px 14px',
               borderBottomLeftRadius: '12px',
               borderBottomRightRadius: '12px',
               cursor: 'pointer',
               color: 'var(--color-secondary)',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               zIndex: 10
             }}
           >
             {isModesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
           </button>
        </div>
        
        <div style={{
           display: 'grid',
           gridTemplateRows: isModesOpen ? '1fr' : '0fr',
           transition: 'grid-template-rows 0.3s ease',
           overflow: 'hidden'
        }}>
          <div style={{ minHeight: 0 }}>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '16px', 
              alignItems: 'flex-end', 
              background: '#f8fafc',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              marginTop: '12px',
              marginBottom: '12px'
            }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 180px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  <Filter size={14} /> Mód
                </label>
                <select 
                  value={selectedMode} 
                  onChange={(e) => setSelectedMode(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '14px', color: '#1e293b', outline: 'none', cursor: 'pointer', transition: 'border-color 0.2s', width: '100%' }}
                >
                  {modes.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 180px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  <Star size={14} style={{ color: '#f59e0b' }} /> Csillagok alapján
                </label>
                <select 
                  value={selectedRating} 
                  onChange={(e) => setSelectedRating(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '14px', color: '#1e293b', outline: 'none', cursor: 'pointer', transition: 'border-color 0.2s', width: '100%' }}
                >
                  <option value="">Bármilyen értékelés</option>
                  <option value="4-5">4 - 5 csillag</option>
                  <option value="3-4">3 - 4 csillag</option>
                  <option value="2-3">2 - 3 csillag</option>
                  <option value="1-2">1 - 2 csillag</option>
                </select>
              </div>

              <button 
                onClick={() => { setSelectedCategory('Összes'); setSelectedMode('Összes'); setSelectedRating(''); }}
                style={{ 
                  height: '42px', padding: '0 16px', background: '#e2e8f0', color: '#475569', border: 'none', 
                  borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
                  opacity: (selectedCategory !== 'Összes' || selectedMode !== 'Összes' || selectedRating !== '') ? 1 : 0.5,
                  pointerEvents: (selectedCategory !== 'Összes' || selectedMode !== 'Összes' || selectedRating !== '') ? 'auto' : 'none'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#cbd5e1'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#e2e8f0'}
              >
                <RotateCcw size={14} /> Alaphelyzet
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Játékok betöltése...</div>
      ) : books.length === 0 ? (
        <div className="no-books">Jelenleg nincsenek játékok a katalógusban.</div>
      ) : filteredBooks.length === 0 ? (
        <div className="no-books">Nincs találat a megadott keresésre.</div>
      ) : (
        <div className="books-grid">
          {filteredBooks.map((book) => (
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
