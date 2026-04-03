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

      const data: any = await aiResponse.json();
      console.log('AI válasz:', data);

      if (data.error === 'AI_NO_KEY') {
        setError('NO_API_KEY');
        return;
      }

      if (data.error === 'AI_UNAVAILABLE') {
        setError('Az AI keresés átmenetileg nem elérhető. Próbáld újra később.');
        return;
      }

      if (data.error) {
        setError(data.message || data.error);
        return;
      }

      const rawBooks: Book[] = data;
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
    <div className="page-container flex flex-col h-[calc(100vh-130px)] overflow-hidden">
      {/* Scrollable Results Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-700 ease-in-out ${
          hasSearched ? 'overflow-y-auto pt-0 pb-8 px-2 opacity-100' : 'overflow-hidden opacity-0 h-0'
        }`}
      >
        {/* Results Grid */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 fade-in">
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

      {/* Search Input Section */}
      <div className={`flex-shrink-0 transition-all duration-700 ease-in-out ${
        hasSearched ? 'mt-4' : 'flex-1 flex flex-col justify-center'
      }`}>
        <div className={`max-w-4xl mx-auto w-full transition-all duration-700 ${hasSearched ? 'opacity-100 translate-y-0' : 'opacity-100 -translate-y-12'}`}>
          
          {/* Header text - hide when searched */}
          {!hasSearched && (
            <div className="text-center mb-12 fade-in">
              <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-[#473472] to-[#53629E] bg-clip-text text-transparent tracking-tighter">
                Válaszd ki a következő játékod!
              </h1>
              <p className="text-xl text-[#53629E] font-bold opacity-80">
                Írd le egyszerűen milyen hangulathoz keresel valamit.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border-l-4 border-red-500 rounded-r-xl text-red-500 font-bold fade-in">
              {error === 'NO_API_KEY' ? (
                <span>
                  Nincs megadva Gemini API kulcs! Regisztrálj és szerezz egy ingyenes kulcsot itt: {' '}
                  <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-600 transition-colors">
                    aistudio.google.com
                  </a>
                </span>
              ) : error}
            </div>
          )}

          <form onSubmit={handleSearch} className="w-full">
            <div className={`glass-search-group ${hasSearched ? 'shadow-md ring-1 ring-[#53629E]/10' : 'shadow-2xl'}`}>
              <Sparkles className="ml-6 text-[#87BAC3]" size={24} />
              
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Pl: Adj egy jó sandbox játékot haveroknak..."
                className="glass-search-input"
              />

              <button
                type="submit"
                disabled={loading}
                className="glass-search-btn m-2"
              >
                {loading ? (
                  <>
                    <Search size={22} className="animate-spin" />
                    <span>AI Keresés...</span>
                  </>
                ) : (
                  <>
                    <Search size={22} />
                    <span>Keresés</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Conditional Bottom Spacer */}
      {!hasSearched && <div className="flex-[1.5]" />}

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
