import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { User } from '../services/api';
import { getListsForUser, removeList, removeBookFromList, createListForUser, type BookList } from '../services/lists';
import { RatingsService } from '../services/api';
import { StarRating } from '../components/StarRating';


interface MyListsProps {
  user?: User | null;
}

export function MyLists({ user }: MyListsProps) {
  const [lists, setLists] = useState<BookList[]>([]);
  const [openListId, setOpenListId] = useState<number | null>(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [expandedBooks, setExpandedBooks] = useState<Record<number, boolean>>({});
  const [userRatings, setUserRatings] = useState<Record<number, number>>({});

  useEffect(() => {
    if (user) {
      fetchLists();
      fetchUserRatings();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchUserRatings = async () => {
    if (!user) return;
    try {
      const ratingsService = new RatingsService();
      const ratings = await ratingsService.getUserRatings(user.id);
      const ratingsMap = ratings.reduce((acc, r) => {
        acc[r.bookId] = r.rating;
        return acc;
      }, {} as Record<number, number>);
      setUserRatings(ratingsMap);
    } catch (err) {
      console.error('Hiba az értékelések lekérésekor', err);
    }
  };

  const handleRateBook = async (bookId: number, rating: number) => {
    if (!user) return;
    try {
      const ratingsService = new RatingsService();
      await ratingsService.rateBook(user.id, bookId, rating);
      setUserRatings(prev => ({ ...prev, [bookId]: rating }));
    } catch (err) {
      console.error('Hiba az értékelés mentésekor', err);
      setError('Nem sikerült elmenteni az értékelést.');
    }
  };

  const fetchLists = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userLists = await getListsForUser(String(user.id));
      setLists(userLists);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba a listák lekérésekor');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newListName.trim()) return;

    setIsCreating(true);
    try {
      await createListForUser(String(user.id), newListName.trim());
      setNewListName('');
      await fetchLists();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba a lista létrehozásakor');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteList = async (listId: number) => {
    if (!user) return;
    if (!window.confirm('Biztosan törölni szeretnéd ezt a listát?')) return;

    try {
      await removeList(listId);
      await fetchLists();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba a lista törlésekor');
    }
  };

  const handleRemoveBook = async (listId: number, bookId: number) => {
    if (!user) return;
    try {
      await removeBookFromList(listId, bookId);
      await fetchLists(); // Frissítjük a listákat
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba a könyv eltávolításakor');
    }
  };


  if (!user) {
    return (
      <div className="mylists-container">
        <h2>Saját listáim</h2>
        <div className="no-lists-message">
          <p>Kérlek jelentkezz be a listáid megtekintéséhez.</p>
          <Link to="/login" className="btn btn-primary">Bejelentkezés</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mylists-container">
      <div className="mylists-header">
        <h2>Saját listáim</h2>

        <form onSubmit={handleCreateList} className="create-list-form">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="Új lista neve..."
            className="create-list-input"
            disabled={isCreating}
          />
          <button type="submit" className="btn btn-primary" disabled={!newListName.trim() || isCreating}>
            {isCreating ? 'Létrehozás...' : 'Új lista'}
          </button>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Listák betöltése...</div>
      ) : lists.length === 0 ? (
        <div className="no-lists-message">
          <p>Még nem hoztál létre egy listát sem.</p>
          <p>Keresgélj a játékok között, és add hozzá őket a saját listáidhoz!</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '16px' }}>Böngészés</Link>
        </div>
      ) : (
        <div className="lists-container">
          {lists.map(list => (
            <div
              key={list.id}
              className="list-card"
              style={{
                marginBottom: 16,
                border: '1px solid #ddd',
                borderRadius: 8,
                minHeight: openListId === list.id ? 0 : 220,
                background: '#fff',
                transition: 'min-height 0.2s',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                width: 'calc(4 * 220px + 3 * 16px)', // 4 card (220px) + 3 gap (16px)
                maxWidth: '100%',
                boxSizing: 'border-box',
                alignSelf: 'center'
              }}
            >
              <div className="list-header" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', justifyContent: 'space-between', padding: '8px 16px', background: '#f7f7f7', borderRadius: '8px 8px 0 0' }}
                onClick={() => setOpenListId(openListId === list.id ? null : list.id)}>
                <h3 style={{ margin: 0 }}>{list.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteList(list.id); }}
                    className="btn-icon delete-list-btn"
                    title="Lista törlése"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
                  >
                    🗑️
                  </button>
                  <span style={{ fontSize: 18 }}>{openListId === list.id ? '▲' : '▼'}</span>
                </div>
              </div>
              {openListId === list.id && (
                <div style={{ padding: 16, background: '#fff', borderRadius: '0 0 8px 8px' }}>
                  {list.items && list.items.length > 0 ? (
                    <div className="books-grid" style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)', // Két oszlop, hogy két kártya is elférjen egymás mellett
                      gap: '24px',
                    }}>
                      {list.items.map((item: any) => {
                        const book = item.book;
                        if (!book) return null;
                        const isExpanded = !!expandedBooks[book.id];

                        return (
                          <div
                            key={book.id}
                            className="book-card"
                            style={{
                              gridColumn: isExpanded ? '1 / -1' : 'auto', // Ha nyitva van, a teljes sort átfogja!
                              position: 'relative',
                              display: 'flex',
                              flexDirection: 'row', // Mindig egymás mellett!
                              width: '100%',
                              height: isExpanded ? '550px' : 'auto',
                              cursor: 'pointer',
                              alignItems: 'stretch',
                              background: '#fff',
                              transition: 'all 0.3s ease',
                              boxShadow: isExpanded ? '0 10px 25px rgba(0,0,0,0.1)' : 'none',
                              borderRadius: '8px',
                              zIndex: isExpanded ? 10 : 1,
                              border: '1px solid #ddd'
                            }}
                            onClick={() => setExpandedBooks(prev => ({ ...prev, [book.id]: !prev[book.id] }))}
                          >
                            {/* Bal oldal / Zárt állapot */}
                            <div style={{
                              width: '280px', // A bal oldal mindig pontosan 280px széles
                              minWidth: '280px',
                              display: 'flex',
                              flexDirection: 'column',
                              borderRight: '1px solid #eee',
                            }}>
                              <div className="book-header" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: isExpanded ? '8px' : '0' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', flexWrap: 'wrap' }}>
                                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#222' }}>{book.title}</h3>
                                  <p style={{ fontSize: '12px', color: '#666', margin: 0, fontStyle: 'italic' }}>-</p>
                                  <p style={{ fontSize: '12px', color: '#666', margin: 0, fontStyle: 'italic' }}>{book.author}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  <span className="badge" style={{ fontSize: '12px', padding: '3px 10px' }}>{book.literaryForm}</span>
                                  <span className="badge badge-genre" style={{ fontSize: '12px', padding: '3px 10px' }}>{book.genre}</span>
                                </div>
                              </div>

                              {isExpanded && (
                                <>
                                  <div className="book-cover" style={{ marginTop: '8px', height: '280px' }}>
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
                                  <div className="book-info" style={{ padding: '12px 16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: '8px' }}>
                                    <div className="book-rating-section" style={{ background: '#f8fafc', padding: '8px', borderRadius: '6px', border: '1px solid #eee' }}>
                                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                                        Saját értékelésed
                                      </div>
                                      <div onClick={(e) => e.stopPropagation()}>
                                        <StarRating
                                          rating={userRatings[book.id] || 0}
                                          onRate={(rating) => handleRateBook(book.id, rating)}
                                          size="small"
                                        />
                                      </div>
                                    </div>
                                    <span className="book-number" style={{ fontSize: '12px', textAlign: 'right', marginTop: 'auto', color: '#94a3b8' }}>#{book.sequenceNumber}</span>
                                  </div>
                                  <div className="book-card-actions" style={{ padding: '12px 16px 14px 16px', borderTop: '1px solid #eee', background: '#fafbff', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <button
                                      className="btn"
                                      style={{ width: '100%', background: '#e0e0e0', color: '#333' }}
                                      onClick={e => {
                                        e.stopPropagation();
                                        navigate(`/books/${book.id}`);
                                      }}
                                    >
                                      Részletek
                                    </button>
                                    <button
                                      className="btn btn-addlist"
                                      style={{ width: '100%' }}
                                      onClick={e => {
                                        e.stopPropagation();
                                        handleRemoveBook(list.id, book.id);
                                      }}
                                      title="Eltávolítás a listáról"
                                    >
                                      Eltávolítás
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Jobb oldal: Teljesítmény (progress) sáv és jövőbeli funkciók */}
                            <div style={{
                              flex: 1,
                              background: '#f8fafc',
                              padding: '20px 24px',
                              display: 'flex',
                              flexDirection: 'column',
                              borderTopRightRadius: '10px',
                              borderBottomRightRadius: '10px'
                            }}>
                              <div className="progress-section" style={{ width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Haladás
                                  </span>
                                  <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary)' }}>
                                    0%
                                  </span>
                                </div>
                                <div style={{
                                  width: '100%',
                                  height: '8px',
                                  background: '#e2e8f0',
                                  borderRadius: '4px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    width: '0%', /* Itt lesz a dinamikus százalék */
                                    height: '100%',
                                    background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                                    borderRadius: '4px',
                                    transition: 'width 0.3s ease'
                                  }}></div>
                                </div>
                                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px', margin: '10px 0 0 0', fontStyle: 'italic' }}>
                                  Kezd el!
                                </p>
                              </div>

                              {/* Lenyitott állapot esetén megjelenő extra funkciók */}
                              {isExpanded && (
                                <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
                                  
                                  {/* Achievements (Eredmények) rész */}
                                  <div className="achievements-section">
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'block' }}>
                                      Eredmények (Achievements)
                                    </span>
                                    <div style={{ padding: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#94a3b8', fontSize: '13px', fontStyle: 'italic', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80px' }}>
                                      Még nincsenek elért eredmények.
                                    </div>
                                  </div>

                                  {/* Backseat rész feltöltés gombbal */}
                                  <div className="backseat-section" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Backseat
                                      </span>
                                      <button 
                                        className="btn btn-primary" 
                                        style={{ padding: '6px 16px', fontSize: '12px', background: 'var(--color-secondary)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          alert('Feltöltés funkció hamarosan...');
                                        }}
                                      >
                                        Feltöltés
                                      </button>
                                    </div>
                                    <div style={{ padding: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#94a3b8', fontSize: '13px', fontStyle: 'italic', display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                                      Nincs még feltöltve semmi ide. Használd a Feltöltés gombot!
                                    </div>
                                  </div>

                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-list-message">
                      Ez a lista még üres. Add hozzá a kedvenc játékaidat!
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
