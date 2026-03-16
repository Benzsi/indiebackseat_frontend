import React, { useState, useEffect } from 'react';
import type { User } from '../services/api';
import { getListsForUser, removeList, removeBookFromList, createListForUser, type BookList } from '../services/lists';
import { Link } from 'react-router-dom';

interface MyListsProps {
  user?: User | null;
}

export function MyLists({ user }: MyListsProps) {
  const [lists, setLists] = useState<BookList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLists();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
            <div key={list.id} className="list-card">
              <div className="list-header">
                <h3>{list.name}</h3>
                <button 
                  onClick={() => handleDeleteList(list.id)} 
                  className="btn-icon delete-list-btn" 
                  title="Lista törlése"
                >
                   🗑️ {/* Használhatsz React Icons-t is, ha van */}
                </button>
              </div>

              {list.items && list.items.length > 0 ? (
                 <div className="list-books-grid">
                 {list.items.map((item: any) => {
                    const book = item.book;
                    if (!book) return null; // Fallback, ha a backend nem küldene book objektumot
                    return (
                        <div key={book.id} className="list-book-item">
                            <div className="list-book-cover-container">
                                {book.coverUrl ? (
                                    <img src={book.coverUrl} alt={book.title} className="list-book-cover" referrerPolicy="no-referrer" />
                                ) : (
                                    <div className="list-book-placeholder">📖</div>
                                )}
                            </div>
                            <div className="list-book-info">
                                <h4>{book.title}</h4>
                                <p className="list-book-author">{book.author}</p>
                                <div className="list-book-badges">
                                    <span className="badge badge-small">{book.literaryForm}</span>
                                    <span className="badge badge-genre badge-small">{book.genre}</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleRemoveBook(list.id, book.id)} 
                                className="btn-icon remove-book-btn"
                                title="Eltávolítás a listáról"
                            >
                                ✕
                            </button>
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
          ))}
        </div>
      )}
    </div>
  );
}
