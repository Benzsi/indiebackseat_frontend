import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { User, Book } from '../services/api';
import { BooksService, RatingsService } from '../services/api';
import { StarRating } from '../components/StarRating';
import { AddToListModal } from '../components/AddToListModal';
import { getListsForUser, createListForUser, addBookToList } from '../services/lists';
import type { BookList } from '../services/lists';

interface HomeProps {
  user?: User | null;
  searchQuery?: string;
}

interface BookWithRating extends Book {
  averageRating?: number;
  totalRatings?: number;
}

export function Home({ user, searchQuery = '' }: HomeProps) {
  const navigate = useNavigate();
  const [books, setBooks] = useState<BookWithRating[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredBookId, setHoveredBookId] = useState<number | null>(null);
  const [addListModalOpen, setAddListModalOpen] = useState(false);
  const [lists, setLists] = useState<BookList[]>([]);
  const [selectedBookForList, setSelectedBookForList] = useState<BookWithRating | null>(null);
  const booksService = new BooksService();
  const ratingsService = new RatingsService();

  useEffect(() => {
    if (user) {
      fetchBooks();
      setLists(getListsForUser(String(user.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const data = await booksService.getAllBooks();
      
      // Lekérjük az átlagos értékeléseket is
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
  const handleAddBookToList = (listId: string) => {
    if (user && selectedBookForList) {
      addBookToList(String(user.id), listId, selectedBookForList.id);
      setLists(getListsForUser(String(user.id)));
      setAddListModalOpen(false);
      setSelectedBookForList(null);
    }
  };
  const handleCreateList = (name: string) => {
    if (user) {
      createListForUser(String(user.id), name);
      setLists(getListsForUser(String(user.id)));
    }
  };

  const normalizeForSearch = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const normalizedQuery = normalizeForSearch(searchQuery.trim());
  const filteredBooks = books.filter((book) => {
    if (!normalizedQuery) return true;

    return [book.title, book.author, book.genre, book.literaryForm]
      .some((field) => {
        const normalized = normalizeForSearch(field ?? '');
        return normalized.split(/\s+/).some(word => word.startsWith(normalizedQuery));
      });
  });

  // Ha nincs bejelentkezve, mutasd az üdvözlő képernyőt
  if (!user) {
    return (
      <div className="home">
        <h1>Üdvözlünk a Bookinkben!</h1>
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

  // Ha bejelentkezve van, mutasd a könyveket
  return (
    <div className="home-authenticated">
      <h1>Könyvek katalógusa</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading">Könyvek betöltése...</div>
      ) : books.length === 0 ? (
        <div className="no-books">Jelenleg nincsenek könyvek a katalógusban.</div>
      ) : filteredBooks.length === 0 ? (
        <div className="no-books">Nincs találat a megadott keresésre.</div>
      ) : (
        <div className="books-grid">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="book-card"
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoveredBookId(book.id)}
              onMouseLeave={() => setHoveredBookId(null)}
              onClick={() => navigate(`/books/${book.id}`)}
            >
              {hoveredBookId === book.id ? (
                <div className="book-hover-preview">
                  <div className="book-hover-block">
                    <div className="book-hover-title">Leiras</div>
                    <div className="book-hover-text">
                      {book.lyricNote?.trim() || 'Itt jelenik meg a konyv rovid leirasa.'}
                    </div>
                  </div>
                  <div className="book-hover-block">
                    <div className="book-hover-title">Video</div>
                    <div className="book-hover-text">
                      Fenntartott hely: ide kerulhet elozetes vagy ajanlo video.
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="book-header" style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#222' }}>{book.title}</h3>
                      <p style={{ fontSize: '12px', color: '#666', margin: 0, fontStyle: 'italic' }}>-</p>
                      <p style={{ fontSize: '12px', color: '#666', margin: 0, fontStyle: 'italic' }}>{book.author}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="badge">{book.literaryForm}</span>
                      <span className="badge badge-genre">{book.genre}</span>
                    </div>
                  </div>
                  <div className="book-cover" style={{ marginTop: '8px' }}>
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="cover-image"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.querySelector('.cover-placeholder')!.classList.remove('hidden-placeholder');
                        }}
                      />
                    ) : null}
                    <div className={`cover-placeholder ${book.coverUrl ? 'hidden-placeholder' : ''}`}>📖</div>
                  </div>
                  <div className="book-info">
                    {/* Átlagos értékelés megjelenítése */}
                    <div className="book-rating-section" style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                        Átlagos értékelés:
                      </div>
                      <StarRating
                        rating={book.averageRating || 0}
                        totalRatings={book.totalRatings || 0}
                        readonly
                        size="small"
                      />
                    </div>

                    <span className="book-number">#{book.sequenceNumber}</span>
                  </div>
                </>
              )}
              <div className="book-card-actions">
                <button
                  className="btn btn-addlist"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenAddList(book);
                  }}
                >
                  Listához adás
                </button>
              </div>
            </div>
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
