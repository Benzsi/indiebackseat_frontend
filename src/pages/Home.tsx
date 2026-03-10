import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { User, Book } from '../services/api';
import { BooksService, RatingsService, CommentsService, type Comment } from '../services/api';
import { StarRating } from '../components/StarRating';
import { CommentModal } from '../components/CommentModal';
import { BookBack } from '../components/BookBack';
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

interface BookComments {
  [bookId: number]: Comment[];
}

export function Home({ user, searchQuery = '' }: HomeProps) {
  const [books, setBooks] = useState<BookWithRating[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userRatings, setUserRatings] = useState<Record<number, number>>({});
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookWithRating | null>(null);
  const [flippedBookId, setFlippedBookId] = useState<number | null>(null);
  const [addListModalOpen, setAddListModalOpen] = useState(false);
  const [lists, setLists] = useState<BookList[]>([]);
  const [selectedBookForList, setSelectedBookForList] = useState<BookWithRating | null>(null);
  const [bookComments, setBookComments] = useState<BookComments>({});
  const booksService = new BooksService();
  const ratingsService = new RatingsService();
  const commentsService = new CommentsService();

  useEffect(() => {
    if (user) {
      fetchBooks();
      loadUserRatings();
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

  const loadUserRatings = async () => {
    if (!user) return;
    try {
      const ratings = await ratingsService.getUserRatings(user.id);
      const ratingsMap: Record<number, number> = {};
      ratings.forEach((r: any) => {
        ratingsMap[r.bookId] = r.rating;
      });
      setUserRatings(ratingsMap);
    } catch (err) {
      console.error('Felhasználó értékelésének lekérése sikertelen:', err);
    }
  };

  const handleRate = async (bookId: number, rating: number) => {
    if (!user) return;
    try {
      await ratingsService.rateBook(user.id, bookId, rating);
      setUserRatings({ ...userRatings, [bookId]: rating });
      // Frissítjük a könyvek listáját az új átlaggal
      await fetchBooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba az értékelés során');
    }
  };

  const handleOpenComment = (book: BookWithRating) => {
    setSelectedBook(book);
    setCommentModalOpen(true);
  };

  const handleCloseComment = () => {
    setCommentModalOpen(false);
    setSelectedBook(null);
  };

  const handleSaveComment = async (comment: string) => {
    if (!selectedBook || !user) return;
    try {
      const newComment = await commentsService.createComment(selectedBook.id, comment);
      // Frissítsd a kommenteket az adott könyvhöz
      const existingComments = bookComments[selectedBook.id] || [];
      setBookComments({
        ...bookComments,
        [selectedBook.id]: [...existingComments, newComment],
      });
      handleCloseComment();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Komment mentése sikertelen');
    }
  };

  const handleFlipBook = async (bookId: number) => {
    if (flippedBookId === bookId) {
      setFlippedBookId(null);
    } else {
      setFlippedBookId(bookId);
      // Töltsd be a kommenteket a megjelenítéshez
      if (!bookComments[bookId]) {
        try {
          console.log(`Betöltés kommenteket a könyvhöz: ${bookId}`);
          const comments = await commentsService.getBookComments(bookId);
          console.log(`Betöltött kommentek:`, comments);
          setBookComments((prev) => {
            const updated = { ...prev, [bookId]: comments };
            console.log(`BookComments frissítve:`, updated);
            return updated;
          });
        } catch (err) {
          console.error('Kommentek betöltése sikertelen:', err);
          const errorMsg = err instanceof Error ? err.message : 'Kommentek betöltése sikertelen';
          setError(errorMsg);
          alert(`Kommentek betöltése sikertelen: ${errorMsg}`);
        }
      } else {
        console.log(`Kommentek már betöltve a(z) ${bookId} könyvhöz:`, bookComments[bookId]);
      }
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
            <div key={book.id} className="book-card" style={{ position: 'relative' }}>
              {flippedBookId === book.id ? (
                <div onClick={() => handleFlipBook(book.id)} style={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <BookBack
                    title={book.title}
                    author={book.author}
                    averageRating={book.averageRating || 0}
                    totalRatings={book.totalRatings || 0}
                    comments={(bookComments[book.id] || []).map((c) => ({
                      user: c.user.username,
                      text: c.content,
                    }))}
                  />
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
                  <div className="book-cover" onClick={() => handleFlipBook(book.id)} style={{ cursor: 'pointer', marginTop: '8px' }}>
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

                    {/* Felhasználó értékelése */}
                    <div className="user-rating-section" style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #eee' }}>
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                        {userRatings[book.id] ? 'Az értékelésed:' : 'Értékeld te is:'}
                      </div>
                      <StarRating
                        rating={userRatings[book.id] || 0}
                        onRate={(rating) => handleRate(book.id, rating)}
                        size="medium"
                      />
                    </div>
                    
                    <span className="book-number">#{book.sequenceNumber}</span>
                  </div>
                  <div className="book-card-actions">
                    <button className="btn btn-comment" onClick={() => handleOpenComment(book)}>Komment</button>
                    <button className="btn btn-addlist" onClick={() => handleOpenAddList(book)}>Listához adás</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Komment ablak */}
      <CommentModal
        isOpen={commentModalOpen}
        onClose={handleCloseComment}
        onSave={handleSaveComment}
        bookTitle={selectedBook?.title || ''}
      />
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
