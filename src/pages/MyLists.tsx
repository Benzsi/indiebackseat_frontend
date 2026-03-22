import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { User, SteamAchievementsResponse } from '../services/api';
import { getListsForUser, removeList, removeBookFromList, createListForUser, type BookList } from '../services/lists';
import { RatingsService, SteamService } from '../services/api';
import { StarRating } from '../components/StarRating';
import { Library, Plus, Trash2, ChevronDown, ChevronUp, FolderPlus } from 'lucide-react';


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
  const [bookAchievements, setBookAchievements] = useState<Record<number, SteamAchievementsResponse | 'loading' | 'none'>>(() => {
    // Mentettük az eddig lekérteket, így oldalfrissítés után se küld felesleges API kérést a backendnek
    if (!user) return {};
    const cached = localStorage.getItem(`steam_ach_${user.id}`);
    if (cached) {
       try { return JSON.parse(cached); } catch { return {}; }
    }
    return {};
  });

  useEffect(() => {
    if (user && Object.keys(bookAchievements).length > 0) {
      localStorage.setItem(`steam_ach_${user.id}`, JSON.stringify(bookAchievements));
    }
  }, [bookAchievements, user]);
  useEffect(() => {
    if (user) {
      fetchLists();
      fetchUserRatings();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Automatikusan lekéri egy adott lista összes játékának achievementjét, amikor lenyitják a listát
  useEffect(() => {
    if (!openListId || !lists.length) return;
    
    const activeList = lists.find(l => l.id === openListId);
    if (!activeList || !activeList.items) return;

    const steamSvc = new SteamService();
    activeList.items.forEach((item: any) => {
      const book = item.book;
      if (!book) return;

      // Ha még se nem töltöttük le, se nem vagyunk épp letöltés alatt
      if (!bookAchievements[book.id]) {
        setBookAchievements(prev => ({ ...prev, [book.id]: 'loading' }));
        
        steamSvc.getGameAchievements(book.id)
          .then(data => {
            if (data.achievements && data.achievements.length > 0) {
              setBookAchievements(prev => ({ ...prev, [book.id]: data }));
            } else {
              setBookAchievements(prev => ({ ...prev, [book.id]: 'none' }));
            }
          })
          .catch(() => setBookAchievements(prev => ({ ...prev, [book.id]: 'none' })));
      }
    });

  }, [openListId, lists]); // Szándékosan nem tettem be a bookAchievements-t a deps-be, különben végtelen ciklus is lehetne

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
      <div className="mylists-container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <Library size={56} color="var(--color-primary)" style={{ opacity: 0.9, marginBottom: '16px' }} />
        <h2 style={{ color: 'var(--color-primary)' }}>Saját listáim</h2>
        <div className="no-lists-message">
          <p>Kérlek jelentkezz be a listáid megtekintéséhez.</p>
          <Link to="/login" className="nav-pill nav-pill-primary" style={{ marginTop: '16px' }}>Bejelentkezés</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mylists-container">
      <div className="section-header">
        <div className="section-header-left">
          <div className="section-icon-box">
            <Library size={28} />
          </div>
          <h2 style={{ margin: 0, color: 'var(--color-primary)' }}>Saját listáim</h2>
        </div>

        <form onSubmit={handleCreateList} className="create-list-pill">
          <FolderPlus size={20} color="var(--color-secondary)" style={{ marginLeft: '12px' }} />
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="Új lista neve..."
            disabled={isCreating}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--color-primary)', marginLeft: '8px', fontSize: '15px' }}
          />
          <button type="submit" className="nav-pill nav-pill-primary" disabled={!newListName.trim() || isCreating} style={{ padding: '8px 16px' }}>
            <Plus size={16} />
            {isCreating ? 'Létrehozás...' : 'Új lista'}
          </button>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading" style={{ color: 'var(--color-secondary)' }}>Listák betöltése...</div>
      ) : lists.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">Még nem hoztál létre egy listát sem.</p>
          <p className="empty-state-sub">Keresgélj a játékok között, és add hozzá őket a saját listáidhoz!</p>
          <Link to="/" className="nav-pill nav-pill-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>Böngészés</Link>
        </div>
      ) : (
        <div className="lists-container">
          {lists.map(list => (
            <div
              key={list.id}
              className="list-card-wrapper"
              style={{ width: 'calc(4 * 220px + 3 * 16px)', alignSelf: 'center' }}
            >
              <div
                className="list-header-row"
                style={{ background: openListId === list.id ? 'var(--color-bg)' : '#f4f7f9', borderBottom: openListId === list.id ? '1px solid var(--color-accent)' : 'none' }}
                onClick={() => setOpenListId(openListId === list.id ? null : list.id)}
              >
                <div className="flex-gap-12">
                  <Library size={20} color="var(--color-primary)" />
                  <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>{list.name}</h3>
                  <span style={{ fontSize: '13px', background: 'var(--color-accent)', color: '#fff', padding: '2px 8px', borderRadius: '999px' }}>{list.items?.length || 0}</span>
                </div>
                <div className="flex-gap-12">
                  <Link
                    to="/"
                    onClick={e => e.stopPropagation()}
                    title="Új játék felvétele (Tovább a főoldalra)"
                    className="icon-btn"
                    style={{ background: '#e0e7ff', color: 'var(--color-primary)', textDecoration: 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#c7d2fe'}
                    onMouseLeave={e => e.currentTarget.style.background = '#e0e7ff'}
                  >
                    <Plus size={16} />
                  </Link>
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteList(list.id); }}
                    title="Lista törlése"
                    className="icon-btn icon-btn-delete"
                  >
                    <Trash2 size={16} />
                  </button>
                  <span style={{ color: 'var(--color-secondary)' }}>{openListId === list.id ? <ChevronUp size={22} /> : <ChevronDown size={22} />}</span>
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
                              gridColumn: isExpanded ? '1 / -1' : 'auto', // STRICTLY KEPT
                              position: 'relative',
                              display: 'flex',
                              flexDirection: 'row', // STRICTLY KEPT
                              width: '100%',
                              height: 'auto', // Lenyitva is auto, így nem csúsznak el az elemek
                              minHeight: isExpanded ? '520px' : 'auto',
                              cursor: 'pointer',
                              alignItems: 'stretch',
                              background: '#fff',
                              transition: 'all 0.3s ease',
                              boxShadow: isExpanded ? '0 10px 25px rgba(39,55,77,0.1)' : '0 2px 8px rgba(39,55,77,0.05)',
                              borderRadius: '8px',
                              zIndex: isExpanded ? 10 : 1,
                              border: '1px solid var(--color-accent)' // Color changed
                            }}
                            onClick={() => {
                              const nowExpanded = !expandedBooks[book.id];
                              setExpandedBooks(prev => ({ ...prev, [book.id]: nowExpanded }));
                            }}
                          >
                            {/* Bal oldal / Zárt állapot */}
                            <div style={{
                              width: '280px', // STRICTLY KEPT
                              minWidth: '280px', // STRICTLY KEPT
                              display: 'flex',
                              flexDirection: 'column',
                              borderRight: '1px solid var(--color-accent)', // Color changed
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
                                  <div className="book-cover" style={{ position: 'relative', marginTop: '8px', height: '280px', border: '3px solid var(--color-primary)', borderRadius: '6px', margin: '0 12px 12px', overflow: 'hidden', display: 'block' }}>
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
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 10 }}
                                      />
                                    ) : null}
                                    <div className={`cover-placeholder ${book.coverUrl ? 'hidden-placeholder' : ''}`} style={{ position: 'absolute', top: 0, left: 0, fontSize: '3rem', width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>📖</div>
                                  </div>
                                  <div className="book-info" style={{ padding: '0 16px 12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: '8px' }}>
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
                              background: 'var(--color-bg)',
                              padding: '24px',
                              display: 'flex',
                              flexDirection: 'column',
                              borderTopRightRadius: '8px',
                              borderBottomRightRadius: '8px'
                            }}>
                              <div className="progress-section" style={{ width: '100%' }}>
                                {(() => {
                                  const ach = bookAchievements[book.id];
                                  const achData = (ach && ach !== 'loading' && ach !== 'none') ? ach as SteamAchievementsResponse : null;
                                  const achievedCount = achData ? achData.achievements.filter(a => a.achieved === 1).length : 0;
                                  const totalCount = achData ? achData.achievements.length : 0;
                                  const pct = totalCount > 0 ? Math.round((achievedCount / totalCount) * 100) : 0;
                                  return (
                                    <>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                          Haladás
                                        </span>
                                        <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary)' }}>
                                          {ach === 'loading' ? '...' : `${pct}%`}
                                        </span>
                                      </div>
                                      <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                          width: ach === 'loading' ? '0%' : `${pct}%`,
                                          height: '100%',
                                          background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                                          borderRadius: '4px',
                                          transition: 'width 0.5s ease'
                                        }}></div>
                                      </div>
                                      <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px', margin: '10px 0 0 0', fontStyle: 'italic' }}>
                                        {ach === 'loading' ? 'Adatok betöltése...' : achData ? `${achievedCount} / ${totalCount} achievement teljesítve` : 'Kezdd el!'}
                                      </p>
                                    </>
                                  );
                                })()}
                              </div>

                              {/* Lenyitott állapot esetén megjelenő extra funkciók */}
                              {isExpanded && (
                                <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>

                                  {/* Achievements (Eredmények) rész */}
                                  <div className="achievements-section">
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'block' }}>
                                      Eredmények (Achievements)
                                    </span>
                                    {bookAchievements[book.id] === 'loading' ? (
                                      <div style={{ padding: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#94a3b8', fontSize: '13px', textAlign: 'center', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        ⏳ Steam adatok betöltése...
                                      </div>
                                    ) : bookAchievements[book.id] === 'none' || !bookAchievements[book.id] ? (
                                      <div style={{ padding: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#94a3b8', fontSize: '13px', fontStyle: 'italic', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80px' }}>
                                        Ehhez a játékhoz nincs Steam achievement adat.
                                      </div>
                                    ) : (() => {
                                      const achData = bookAchievements[book.id] as SteamAchievementsResponse;
                                      const achieved = achData.achievements.filter(a => a.achieved === 1);
                                      const notAchieved = achData.achievements.filter(a => a.achieved !== 1);
                                      return (
                                        <div>
                                          {/* Megvan */}
                                          {achieved.length > 0 && (
                                            <div style={{ marginBottom: '12px' }}>
                                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#4caf50', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✓ Megvan ({achieved.length})</div>
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                                                {achieved.map(ach => (
                                                  <div key={ach.apiName} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px' }}>
                                                    <img src={ach.icon} alt={ach.name} style={{ width: '36px', height: '36px', borderRadius: '4px', flexShrink: 0 }} referrerPolicy="no-referrer" />
                                                    <div>
                                                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#166534' }}>{ach.name}</div>
                                                      {ach.description && <div style={{ fontSize: '11px', color: '#4ade80' }}>{ach.description}</div>}
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          {/* Nincs meg */}
                                          {notAchieved.length > 0 && (
                                            <div>
                                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✗ Hiányzik ({notAchieved.length})</div>
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                                                {notAchieved.map(ach => (
                                                  <div key={ach.apiName} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', opacity: 0.6 }}>
                                                    <img src={ach.icon} alt={ach.name} style={{ width: '36px', height: '36px', borderRadius: '4px', flexShrink: 0, filter: 'grayscale(1)' }} referrerPolicy="no-referrer" />
                                                    <div>
                                                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>{ach.name}</div>
                                                      {ach.description && <div style={{ fontSize: '11px', color: '#94a3b8' }}>{ach.description}</div>}
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
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
