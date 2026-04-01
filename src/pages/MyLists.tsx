import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { User, SteamAchievementsResponse } from '../services/api';
import { getListsForUser, removeList, removeBookFromList, createListForUser, uploadListImage, uploadBookItemGallery, deleteGalleryItem, type BookList } from '../services/lists';
import { RatingsService, SteamService } from '../services/api';
import { StarRating } from '../components/StarRating';
import { Library, Plus, Trash2, ChevronDown, ChevronUp, FolderPlus, Gamepad2, Info, Image as ImageIcon, Camera } from 'lucide-react';

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
  const [expandedAchievements, setExpandedAchievements] = useState<Record<number, boolean>>({});
  const [userRatings, setUserRatings] = useState<Record<number, number>>({});
  const [bookAchievements, setBookAchievements] = useState<Record<number, SteamAchievementsResponse | 'loading' | 'none'>>(() => {
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

  useEffect(() => {
    if (!openListId || !lists.length) return;
    
    const activeList = lists.find(l => l.id === openListId);
    if (!activeList || !activeList.items) return;

    const steamSvc = new SteamService();
    activeList.items.forEach((item: any) => {
      const book = item.book;
      if (!book) return;

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

  }, [openListId, lists]);

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

  const handleDeleteGalleryItem = async (e: React.MouseEvent, itemId: number) => {
    e.stopPropagation();
    if (!window.confirm('Biztosan törölni szeretnéd ezt az emléket?')) return;
    
    try {
      await deleteGalleryItem(itemId);
      await fetchLists();
    } catch (err) {
      setError('Hiba a törlés során');
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
      await fetchLists();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba a könyv eltávolításakor');
    }
  };

  const listUploadInputRef = React.useRef<HTMLInputElement>(null);
  const bookItemUploadInputRef = React.useRef<HTMLInputElement>(null);
  const [activeUploadId, setActiveUploadId] = useState<number | null>(null);
  const [activeBookId, setActiveBookId] = useState<number | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'IMAGE' | 'VIDEO' } | null>(null);

  const triggerListUpload = (listId: number) => {
    setActiveUploadId(listId);
    listUploadInputRef.current?.click();
  };

  const triggerBookItemGalleryUpload = (listId: number, bookId: number) => {
    setActiveUploadId(listId);
    setActiveBookId(bookId);
    bookItemUploadInputRef.current?.click();
  };

  const handleUploadImage = async (listId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    try {
      await uploadListImage(listId, file);
      await fetchLists();
    } catch (err) {
      setError('Hiba a kép feltöltésekor');
    }
  };

  const handleUploadBookGallery = async (listId: number, bookId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    try {
      await uploadBookItemGallery(listId, bookId, file);
      await fetchLists();
    } catch (err) {
      setError('Hiba a galéria feltöltésekor');
    }
  };

  if (!user) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-20 flex flex-col items-center text-center">
        <Library size={64} className="text-[#87BAC3] mb-6 opacity-50" />
        <h2 className="text-3xl font-black text-[#D6F4ED] mb-4">Saját listáim</h2>
        <p className="text-[#87BAC3] mb-8">Kérlek jelentkezz be a listáid megtekintéséhez.</p>
        <Link to="/login" className="px-8 py-3 rounded-2xl bg-[#D6F4ED] text-[#473472] font-black hover:bg-[#87BAC3] transition-all">Bejelentkezés</Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 py-8">
      <input 
        ref={listUploadInputRef}
        type="file" 
        className="hidden" 
        accept="image/*"
        onChange={(e) => activeUploadId && handleUploadImage(activeUploadId, e)}
      />
      <input 
        ref={bookItemUploadInputRef}
        type="file" 
        className="hidden" 
        accept="image/*,video/*"
        onChange={(e) => activeUploadId && activeBookId && handleUploadBookGallery(activeUploadId, activeBookId, e)}
      />

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#473472] flex items-center justify-center shadow-lg shadow-[#473472]/20">
            <Library size={28} color="#D6F4ED" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#473472] tracking-tight">Saját listáim</h1>
            <p className="text-[#53629E] font-bold opacity-80">Kezeld és rendszerezd a játékaidat</p>
          </div>
        </div>

        <form onSubmit={handleCreateList} className="flex items-center bg-white border-2 border-[#53629E]/30 rounded-2xl p-1.5 focus-within:border-[#473472] transition-all min-w-[320px] shadow-sm">
          <FolderPlus size={20} className="text-[#53629E] ml-3" />
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="Új lista neve..."
            disabled={isCreating}
            className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-[#473472] placeholder-[#53629E]/50 text-sm font-bold"
          />
          <button 
            type="submit" 
            disabled={!newListName.trim() || isCreating}
            className="bg-[#473472] text-[#D6F4ED] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-[#53629E] transition-all disabled:opacity-50"
          >
            <Plus size={14} />
            {isCreating ? '...' : 'Létrehozás'}
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-8 px-5 py-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-300 font-bold text-sm animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-[#87BAC3] font-bold animate-pulse">Listák betöltése...</div>
      ) : lists.length === 0 ? (
        <div className="py-20 text-center bg-[#473472] border border-dashed border-[#53629E] rounded-3xl p-8">
          <Library size={48} className="mx-auto text-[#53629E] mb-4" />
          <p className="text-xl font-bold text-[#D6F4ED] mb-2">Még nem hoztál létre egy listát sem.</p>
          <p className="text-[#87BAC3] mb-8 max-w-sm mx-auto">Keresgélj a játékok között, és add hozzá őket a saját listáidhoz!</p>
          <Link to="/" className="px-8 py-3 rounded-2xl bg-[#D6F4ED] text-[#473472] font-black hover:bg-[#87BAC3] transition-all">Böngészés</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {lists.map(list => (
            <div key={list.id} className="bg-[#473472] border border-[#53629E] rounded-3xl overflow-hidden shadow-xl transition-all">
              {/* List Header */}
              <div 
                className={`flex items-center justify-between p-6 cursor-pointer transition-colors ${openListId === list.id ? 'bg-[#53629E]/30' : 'hover:bg-[#53629E]/20'}`}
                onClick={(e) => {
                  if (e.target instanceof HTMLElement && (e.target.closest('button') || e.target.closest('label') || e.target.closest('a'))) return;
                  setOpenListId(openListId === list.id ? null : list.id);
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden border border-[#53629E]/30 shadow-md bg-[#53629E] text-[#D6F4ED]">
                      {list.imagePath ? (
                        <img 
                          src={`http://localhost:3000/uploads/${list.imagePath}`} 
                          alt={list.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Library size={24} />
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#D6F4ED] leading-none mb-1">{list.name}</h3>
                    <span className="text-[10px] uppercase tracking-widest font-black text-[#87BAC3]">
                      {list.items?.length || 0} játék a listában
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 relative z-30" onClick={e => e.stopPropagation()}>
                  <button 
                    type="button"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#87BAC3] text-[#473472] hover:bg-[#D6F4ED] transition-all cursor-pointer shadow-lg active:scale-95 font-bold text-xs"
                    title="Borítókép feltöltése"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      triggerListUpload(list.id);
                    }}
                  >
                    <Camera size={16} />
                    <span>Feltöltés</span>
                  </button>
                  <Link
                    to="/"
                    title="Játék hozzáadása"
                    className="p-2.5 rounded-xl bg-[#53629E]/40 text-[#D6F4ED] hover:bg-[#87BAC3] hover:text-[#473472] transition-all"
                  >
                    <Plus size={18} />
                  </Link>
                  <button
                    onClick={() => handleDeleteList(list.id)}
                    className="p-2.5 rounded-xl bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="ml-2 text-[#87BAC3]">
                    {openListId === list.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </div>
                </div>
              </div>

              {/* List Content */}
              {openListId === list.id && (
                <div className="p-6 pt-2 bg-[#1a1228]/30">
                  {list.items && list.items.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {list.items.map((item: any) => {
                        const book = item.book;
                        if (!book) return null;
                        const isExpanded = !!expandedBooks[book.id];
                        const ach = bookAchievements[book.id];
                        const achData = (ach && ach !== 'loading' && ach !== 'none') ? ach as SteamAchievementsResponse : null;

                        return (
                          <div
                            key={book.id}
                            className={`relative bg-[#473472] border border-[#53629E] rounded-2xl overflow-hidden transition-all duration-500 shadow-lg ${
                              isExpanded ? 'col-span-full ring-2 ring-[#87BAC3]/50' : 'hover:scale-[1.02]'
                            }`}
                            onClick={(e) => {
                              if (e.target instanceof HTMLElement && (e.target.closest('button') || e.target.closest('label') || e.target.closest('a'))) return;
                              setExpandedBooks(prev => ({ ...prev, [book.id]: !isExpanded }));
                            }}
                          >
                            <div className={`flex flex-col md:flex-row h-full ${isExpanded ? '' : 'cursor-pointer'}`}>
                              
                              {/* Book Main Section (Left) */}
                              <div className={`${isExpanded ? 'w-full md:w-[320px]' : 'w-full'} flex flex-col border-r border-[#53629E]/30`}>
                                {/* Header */}
                                <div className="p-4 flex flex-col gap-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <h3 className="text-base font-black text-[#D6F4ED] line-clamp-1">{book.title}</h3>
                                    {isExpanded && <Info size={16} className="text-[#87BAC3] flex-shrink-0" />}
                                  </div>
                                  <div className="flex gap-1.5 flex-wrap">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-400/20 uppercase tracking-tighter">
                                      {book.literaryForm}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-400/20 uppercase tracking-tighter">
                                      {book.genre}
                                    </span>
                                  </div>
                                </div>

                                {isExpanded && (
                                  <>
                                    {/* Expanded Cover/Image */}
                                    <div className="px-4 mb-6">
                                      <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 border-[#53629E]/30 flex-shrink-0 bg-gradient-to-br from-[#473472] to-[#53629E] flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.3)]">
                                        {book.coverUrl ? (
                                          <img 
                                            src={book.coverUrl} 
                                            alt={book.title} 
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                          />
                                        ) : (
                                          <div className="text-4xl text-[#53629E]/40">🎮</div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Rating */}
                                    <div className="px-4 mb-4">
                                      <div className="p-3 bg-[#53629E]/20 rounded-xl border border-[#53629E]/30">
                                        <div className="text-[10px] font-black text-[#87BAC3] uppercase tracking-widest mb-1">Saját értékelés</div>
                                        <div onClick={e => e.stopPropagation()}>
                                          <StarRating
                                            rating={userRatings[book.id] || 0}
                                            onRate={(rating) => handleRateBook(book.id, rating)}
                                            size="small"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-auto p-4 flex gap-2 border-t border-[#53629E]/20">
                                      <button
                                        onClick={e => { e.stopPropagation(); navigate(`/books/${book.id}`); }}
                                        className="flex-1 py-2 rounded-xl bg-[#53629E]/30 text-[#D6F4ED] text-[10px] font-black hover:bg-[#53629E]/50 transition-all uppercase tracking-widest"
                                      >
                                        Adatlap
                                      </button>
                                      <button
                                        onClick={e => { e.stopPropagation(); handleRemoveBook(list.id, book.id); }}
                                        className="flex-1 py-2 rounded-xl bg-red-400/10 text-red-400 text-[10px] font-black hover:bg-red-400/20 border border-red-400/20 transition-all uppercase tracking-widest"
                                      >
                                        Törlés
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Progress & Content Section (Right - only when expanded) */}
                              {isExpanded && (
                                <div className="flex-1 bg-[#53629E]/10 p-6 flex flex-col gap-8 overflow-auto max-h-[600px]">
                                  {/* Progress Bar */}
                                  <div>
                                    {(() => {
                                      const achievedCount = achData ? achData.achievements.filter(a => a.achieved === 1).length : 0;
                                      const totalCount = achData ? achData.achievements.length : 0;
                                      const pct = totalCount > 0 ? Math.round((achievedCount / totalCount) * 100) : 0;
                                      return (
                                        <div className="space-y-4">
                                          <div className="flex justify-between items-end">
                                            <div>
                                              <span className="text-[10px] font-black text-[#87BAC3] uppercase tracking-[0.2em] block mb-1">Előrehaladás</span>
                                              <h4 className="text-xl font-black text-[#D6F4ED] leading-none">
                                                {ach === 'loading' ? 'Mérések folyamatban...' : `${pct}% Teljesítve`}
                                              </h4>
                                            </div>
                                            <Gamepad2 className={`text-[#87BAC3] ${ach === 'loading' ? 'animate-bounce' : ''}`} size={24} />
                                          </div>
                                          
                                          <div className="h-3 w-full bg-[#53629E]/30 rounded-full overflow-hidden border border-[#53629E]/50">
                                            <div 
                                              className="h-full bg-gradient-to-r from-[#53629E] to-[#87BAC3] rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(135,186,195,0.4)]"
                                              style={{ width: `${pct}%` }}
                                            />
                                          </div>
                                          
                                          <p className="text-xs font-semibold text-[#87BAC3]/80 italic">
                                            {ach === 'loading' ? 'Steam szinkronizálás folyamatban...' : achData ? `${achievedCount} a ${totalCount} achievementből feloldva` : 'Még nem kezdtél bele ebbe a kalandba.'}
                                          </p>
                                        </div>
                                      );
                                    })()}
                                  </div>

                                  {/* Backseat Gallery Section */}
                                  <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span className="text-[10px] font-black text-[#87BAC3] uppercase tracking-[0.2em] block mb-1">Emlékek</span>
                                        <h4 className="text-xl font-black text-[#D6F4ED] leading-none">Backseat galéria</h4>
                                      </div>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          triggerBookItemGalleryUpload(list.id, book.id);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D6F4ED] text-[#473472] font-black text-xs hover:bg-[#87BAC3] transition-all"
                                      >
                                        <Camera size={14} />
                                        Feltöltés
                                      </button>
                                    </div>

                                    {item.gallery && item.gallery.length > 0 ? (
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {item.gallery.map((galleryItem: any) => (
                                          <div 
                                            key={galleryItem.id} 
                                            className="aspect-video rounded-xl overflow-hidden border border-[#53629E]/30 bg-[#473472]/40 relative group/gallery-item cursor-zoom-in"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedMedia({ 
                                                url: `http://localhost:3000/uploads/${galleryItem.filePath}`, 
                                                type: galleryItem.fileType 
                                              });
                                            }}
                                          >
                                            {galleryItem.fileType === 'VIDEO' ? (
                                              <video 
                                                src={`http://localhost:3000/uploads/${galleryItem.filePath}`} 
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <img 
                                                src={`http://localhost:3000/uploads/${galleryItem.filePath}`} 
                                                className="w-full h-full object-cover"
                                              />
                                            )}
                                            
                                            {/* Delete Button */}
                                            <button
                                              onClick={(e) => handleDeleteGalleryItem(e, galleryItem.id)}
                                              className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/80 text-white opacity-0 group-hover/gallery-item:opacity-100 transition-all hover:bg-red-600 shadow-lg"
                                              title="Törlés"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="py-12 border-2 border-dashed border-[#53629E]/30 rounded-2xl flex flex-col items-center justify-center text-center gap-4">
                                        <ImageIcon size={48} className="text-[#53629E]/30" />
                                        <div>
                                          <p className="text-[#D6F4ED] font-black">A galériád jelenleg üres</p>
                                          <p className="text-xs text-[#87BAC3] font-semibold">Tölts fel képeket vagy videókat a haladásodról!</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Achievements Section */}
                                  <div className="space-y-4">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedAchievements(prev => ({ ...prev, [book.id]: !prev[book.id] }));
                                      }}
                                      className="w-full flex items-center justify-between text-xs font-black text-[#87BAC3] uppercase tracking-[0.2em] border-b border-[#53629E]/40 pb-2 hover:text-[#D6F4ED] transition-colors"
                                    >
                                      <span>Eredmények (Steam)</span>
                                      {expandedAchievements[book.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                    
                                    {expandedAchievements[book.id] && (
                                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        {ach === 'loading' ? (
                                          <div className="flex items-center justify-center py-10 text-[#87BAC3] text-sm animate-pulse">Szkennelés...</div>
                                        ) : (ach === 'none' || !achData) ? (
                                          <div className="text-center py-8 px-4 rounded-2xl bg-[#53629E]/10 border border-dashed border-[#53629E]/30 text-[#87BAC3] text-xs">
                                            Ehhez a játékhoz nincsenek elérhető eredmények.
                                          </div>
                                        ) : (
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                            {achData.achievements.map((a, idx) => (
                                              <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                                a.achieved === 1 
                                                  ? 'bg-blue-500/10 border-blue-400/20 text-[#D6F4ED]' 
                                                  : 'bg-[#53629E]/10 border-[#53629E]/30 opacity-60 grayscale'
                                              }`}>
                                                <img src={a.icon} alt={a.name} className="w-10 h-10 rounded-lg flex-shrink-0" />
                                                <div className="min-w-0">
                                                  <div className="text-xs font-black truncate">{a.name}</div>
                                                  <div className="text-[10px] text-[#87BAC3] line-clamp-1">{a.description || 'Titkos eredmény'}</div>
                                                </div>
                                                {a.achieved === 1 && <div className="ml-auto w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Hover Indicator for closed card */}
                            {!isExpanded && (
                              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#87BAC3] to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 px-6 rounded-3xl bg-[#53629E]/10 border border-dashed border-[#53629E]/30">
                      <p className="text-[#87BAC3] font-bold">Ez a lista még üres.</p>
                      <Link to="/" className="text-[#D6F4ED] text-sm font-black hover:text-[#87BAC3] underline mt-2 block">Kezdj el böngészni!</Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Lightbox Modal */}
      {selectedMedia && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 sm:p-10 animate-in fade-in zoom-in duration-200"
          onClick={() => setSelectedMedia(null)}
        >
          <button 
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-[110]"
            onClick={() => setSelectedMedia(null)}
          >
            <Trash2 className="rotate-45" size={24} /> {/* X character icon */}
          </button>
          
          <div className="max-w-7xl max-h-full w-full h-full flex items-center justify-center relative">
            {selectedMedia.type === 'VIDEO' ? (
              <video 
                src={selectedMedia.url} 
                controls 
                autoPlay
                className="max-w-full max-h-full rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img 
                src={selectedMedia.url} 
                alt="Nagyított kép"
                className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
