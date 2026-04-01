import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Gamepad2, ChevronRight } from 'lucide-react';
import {
  HiOutlineChatAlt2,
  HiOutlineCollection,
  HiOutlineTerminal,
  HiOutlineLightBulb,
  HiOutlineLightningBolt,
  HiOutlineStar,
  HiOutlineUsers,
  HiOutlineGlobeAlt
} from 'react-icons/hi';
import { SiDevbox } from "react-icons/si";
import type { User } from '../services/api';
import { BooksService, RatingsService } from '../services/api';
import { BookCard } from '../components/BookCard';
import type { BookWithRating } from '../components/BookCard';
import { AddToListModal } from '../components/AddToListModal';
import { getListsForUser, createListForUser, addBookToList } from '../services/lists';
import type { BookList } from '../services/lists';

export interface DevLog {
  id: number;
  name: string;
  genre: string;
  literaryForm: string;
  description: string;
  imagePath?: string;
  user: { username: string };
  _count: { devlogentry: number; favorites: number; upvotes: number };
}

interface HomeProps {
  user?: User | null;
  searchQuery?: string;
  selectedCategory?: string;
  selectedMode?: string;
  selectedRating?: string;
  activeTab: 'overview' | 'games' | 'devlogs';
  setActiveTab: (tab: 'overview' | 'games' | 'devlogs') => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function Home({
  user,
  searchQuery = '',
  selectedCategory = 'Összes',
  selectedMode = 'Összes',
  selectedRating = '',
  activeTab,
  setActiveTab,
  sortBy,
  sortOrder
}: HomeProps) {
  const [books, setBooks] = useState<BookWithRating[]>([]);
  const [projects, setProjects] = useState<DevLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredBookId, setHoveredBookId] = useState<number | null>(null);
  const [addListModalOpen, setAddListModalOpen] = useState(false);
  const [lists, setLists] = useState<BookList[]>([]);
  const [selectedBookForList, setSelectedBookForList] = useState<BookWithRating | null>(null);

  const booksService = new BooksService();
  const ratingsService = new RatingsService();

  const fetchProjects = async () => {
    setProjectsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/devlogs');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Hiba a projektek lekérésekor:', err);
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      void fetchBooks();
      void loadUserLists(String(user.id));
      void fetchProjects();
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
      <div className="w-full max-w-[1200px] mx-auto px-4 py-10">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#473472] border border-[#53629E] text-[#87BAC3] text-xs font-bold uppercase tracking-widest mb-6">
            <Gamepad2 size={13} /> Indie játékok közössége
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-[#473472] tracking-tight mb-5 leading-tight">
            indie<span className="text-[#53629E]">.</span>backseat
          </h1>
          <p className="text-[#473472]/70 text-lg max-w-xl mx-auto leading-relaxed mb-10">
            Fedezd fel a legjobb független játékokat, kövess fejlesztői naplókat, és csatlakozz egy szenvedélyes közösséghez.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Játékok */}
          <div className="group relative bg-[#473472] p-8 rounded-3xl border border-[#53629E] shadow-2xl hover:bg-[#53629E] transition-all duration-500 ease-out hover:-translate-y-1 flex flex-col overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 rounded-t-3xl bg-gradient-to-r from-sky-300 to-blue-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="w-14 h-14 rounded-2xl bg-[#D6F4ED]/10 backdrop-blur-sm border border-[#D6F4ED]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
              <HiOutlineCollection size={28} className="text-sky-300" />
            </div>
            <h3 className="text-xl font-black mb-3 text-[#D6F4ED] tracking-tight">Interaktív Játék Katalógus</h3>
            <p className="text-[#D6F4ED]/80 leading-relaxed text-sm mb-6">
              Böngéssz a folyamatosan frissülő, <strong className="text-[#D6F4ED]">kézzel válogatott független játékgyűjteményünkben</strong>! Fedezd fel a <strong className="text-[#D6F4ED]">rejtett gyöngyszemeket</strong> is.
            </p>
            <ul className="list-none flex flex-col gap-3 mt-auto p-0">
              {[
                { icon: <HiOutlineLightningBolt className="text-sky-300" size={14} />, title: 'Intelligens szűrés', sub: 'kategória és játékmenet szerint' },
                { icon: <HiOutlineStar className="text-amber-300" size={14} />, title: 'Valódi értékelések', sub: 'és csillag alapú rangsorolás' },
                { icon: <HiOutlineGlobeAlt className="text-blue-300" size={14} />, title: 'Indie fókusz', sub: 'dedikált felület stúdióknak' },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[#D6F4ED] bg-[#D6F4ED]/5 p-3 rounded-xl border border-[#D6F4ED]/5">
                  <div className="bg-[#D6F4ED]/10 p-1.5 rounded-lg shrink-0">{item.icon}</div>
                  <span className="mt-0.5"><strong className="text-[#D6F4ED]">{item.title}</strong><br /><span className="text-[#D6F4ED]/60 text-xs">{item.sub}</span></span>
                </li>
              ))}
            </ul>
          </div>

          {/* Dev Logs */}
          <div className="group relative bg-[#473472] p-8 rounded-3xl border border-[#53629E] shadow-2xl hover:bg-[#53629E] transition-all duration-500 ease-out hover:-translate-y-1 flex flex-col overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 rounded-t-3xl bg-gradient-to-r from-amber-300 to-orange-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="w-14 h-14 rounded-2xl bg-[#D6F4ED]/10 backdrop-blur-sm border border-[#D6F4ED]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
              <HiOutlineTerminal size={28} className="text-amber-300" />
            </div>
            <h3 className="text-xl font-black mb-3 text-[#D6F4ED] tracking-tight">Fejlesztői Naplók (Dev Logs)</h3>
            <p className="text-[#D6F4ED]/80 leading-relaxed text-sm mb-6">
              Lépj be a kulisszák mögé. A <strong className="text-[#D6F4ED]">Dev Logs szekció közvetlen betekintést nyújt</strong> a fejlesztők napi munkájába.
            </p>
            <ul className="list-none flex flex-col gap-3 mt-auto p-0">
              {[
                { icon: <HiOutlineLightBulb className="text-amber-300" size={14} />, title: 'Koncepciók és ötletek', sub: 'korai fázisú bemutatása' },
                { icon: <SiDevbox className="text-sky-300" size={14} />, title: 'Exkluzív tartalom', sub: 'közvetlenül az alkotóktól' },
                { icon: <HiOutlineUsers className="text-emerald-300" size={14} />, title: 'Közvetlen kapcsolat', sub: 'a fejlesztői közösséggel' },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[#D6F4ED] bg-[#D6F4ED]/5 p-3 rounded-xl border border-[#D6F4ED]/5">
                  <div className="bg-[#D6F4ED]/10 p-1.5 rounded-lg shrink-0">{item.icon}</div>
                  <span className="mt-0.5"><strong className="text-[#D6F4ED]">{item.title}</strong><br /><span className="text-[#D6F4ED]/60 text-xs">{item.sub}</span></span>
                </li>
              ))}
            </ul>
          </div>

          {/* Közösség */}
          <div className="group relative bg-[#473472] p-8 rounded-3xl border border-[#53629E] shadow-2xl hover:bg-[#53629E] transition-all duration-500 ease-out hover:-translate-y-1 flex flex-col overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 rounded-t-3xl bg-gradient-to-r from-emerald-300 to-teal-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="w-14 h-14 rounded-2xl bg-[#D6F4ED]/10 backdrop-blur-sm border border-[#D6F4ED]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
              <HiOutlineChatAlt2 size={28} className="text-emerald-300" />
            </div>
            <h3 className="text-xl font-black mb-3 text-[#D6F4ED] tracking-tight">Közösségi Élet és "Backseating"</h3>
            <p className="text-[#D6F4ED]/80 leading-relaxed text-sm mb-6">
              Nálunk a <strong className="text-[#D6F4ED]">backseating nem csak egy kifejezés, hanem közösségi alapérték</strong>.
            </p>
            <ul className="list-none flex flex-col gap-3 mt-auto p-0">
              {[
                { icon: <HiOutlineUsers className="text-sky-300" size={14} />, title: 'Aktív Fórum', sub: 'Szólj hozzá a legújabb posztokhoz' },
                { icon: <HiOutlineLightningBolt className="text-amber-300" size={14} />, title: 'Tippek & Trükkök', sub: 'Oszd meg a tudásod másokkal' },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[#D6F4ED] bg-[#D6F4ED]/5 p-3 rounded-xl border border-[#D6F4ED]/5">
                  <div className="bg-[#D6F4ED]/10 p-1.5 rounded-lg shrink-0">{item.icon}</div>
                  <span className="mt-0.5"><strong className="text-[#D6F4ED]">{item.title}</strong><br /><span className="text-[#D6F4ED]/60 text-xs">{item.sub}</span></span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 text-center flex flex-col items-center gap-4">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#473472] text-[#D6F4ED] font-black text-sm hover:bg-[#53629E] transition-all duration-300 shadow-lg shadow-[#473472]/20"
          >
            Bejelentkezés <ChevronRight size={16} />
          </Link>
          <p className="text-[#473472]/50 text-sm">Már van fiókod? Jelentkezz be fent.</p>
          <p className="text-[#473472]/60 text-sm">
            Nincs még fiókod?{' '}
            <Link to="/register" className="text-[#473472] font-bold underline underline-offset-2 hover:text-[#53629E] transition-colors">
              Regisztrálj itt →
            </Link>
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="home-authenticated">
      <div style={{ marginBottom: '32px' }}>

        {/* Navigation Buttons Row - Centered */}
        <div className="flex justify-center flex-wrap gap-4 mb-6 mt-0">
          <button
            onClick={() => setActiveTab('games')}
            className={`flex items-center gap-2 px-8 py-3 rounded-full font-extrabold text-[15px] border-2 transition-all duration-300 shadow-sm hover:shadow-md ${activeTab === 'games'
                ? 'bg-[#473472] text-[#D6F4ED] border-[#473472] hover:bg-[#53629E] hover:border-[#53629E] hover:text-white shadow-[#473472]/20'
                : 'bg-[#D6F4ED] text-[#473472] border-[#473472] hover:opacity-90'
              }`}
          >
            <HiOutlineCollection size={20} />
            Játékok
          </button>

          <button
            onClick={() => setActiveTab('devlogs')}
            className={`flex items-center gap-2 px-8 py-3 rounded-full font-extrabold text-[15px] border-2 transition-all duration-300 shadow-sm hover:shadow-md ${activeTab === 'devlogs'
                ? 'bg-[#473472] text-[#D6F4ED] border-[#473472] hover:bg-[#53629E] hover:border-[#53629E] hover:text-white shadow-[#473472]/20'
                : 'bg-[#D6F4ED] text-[#473472] border-[#473472] hover:opacity-90'
              }`}
          >
            <SiDevbox size={18} />
            Dev Logs
          </button>
        </div>

        {/* Dashboard / Home Content */}
        {activeTab === 'overview' && (
          <div style={{ marginBottom: '40px' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4" style={{ animation: 'fadeIn 0.5s ease-out' }}>
              {/* Game Catalog Section */}
              <div className="group relative bg-[#473472] p-8 rounded-3xl border border-[#53629E] shadow-2xl hover:bg-[#53629E] transition-all duration-500 ease-out hover:-translate-y-1 flex flex-col overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 rounded-t-3xl bg-gradient-to-r from-sky-300 to-blue-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="w-14 h-14 rounded-2xl bg-[#D6F4ED]/10 backdrop-blur-sm border border-[#D6F4ED]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                  <HiOutlineCollection size={28} className="text-sky-300" />
                </div>
                <h3 className="text-2xl font-black mb-4 text-[#D6F4ED] tracking-tight transition-colors duration-300">Interaktív Játék Katalógus</h3>
                <p className="text-[#D6F4ED]/80 leading-relaxed text-[15px] mb-6">
                  Böngéssz a folyamatosan frissülő, <strong className="text-[#D6F4ED]">kézzel válogatott független játékgyűjteményünkben</strong>! Nálunk nem csak a legnagyobb slágereket találod meg, hanem azokat a <strong className="text-[#D6F4ED]">rejtett gyöngyszemeket is</strong>, amelyekre máshol nem bukkannál rá.
                </p>
                <ul className="list-none flex flex-col gap-4 mb-2 p-0 mt-auto">
                  <li className="flex items-start gap-3 text-sm text-[#D6F4ED] bg-[#D6F4ED]/5 p-3 rounded-xl hover:bg-[#D6F4ED]/10 transition-colors duration-200 border border-[#D6F4ED]/5">
                    <div className="bg-[#D6F4ED]/10 p-1.5 rounded-lg shrink-0">
                      <HiOutlineLightningBolt className="text-sky-300" size={16} />
                    </div>
                    <span className="mt-0.5"><strong className="text-[#D6F4ED]">Intelligens szűrés</strong><br /><span className="text-[#D6F4ED]/60 text-xs">kategória és játékmenet szerint</span></span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-[#D6F4ED] bg-[#D6F4ED]/5 p-3 rounded-xl hover:bg-[#D6F4ED]/10 transition-colors duration-200 border border-[#D6F4ED]/5">
                    <div className="bg-[#D6F4ED]/10 p-1.5 rounded-lg shrink-0">
                      <HiOutlineStar className="text-amber-300" size={16} />
                    </div>
                    <span className="mt-0.5"><strong className="text-[#D6F4ED]">Valódi értékelések</strong><br /><span className="text-[#D6F4ED]/60 text-xs">és csillag alapú rangsorolás</span></span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-[#D6F4ED] bg-[#D6F4ED]/5 p-3 rounded-xl hover:bg-[#D6F4ED]/10 transition-colors duration-200 border border-[#D6F4ED]/5">
                    <div className="bg-[#D6F4ED]/10 p-1.5 rounded-lg shrink-0">
                      <HiOutlineGlobeAlt className="text-blue-300" size={16} />
                    </div>
                    <span className="mt-0.5"><strong className="text-[#D6F4ED]">Indie fókusz</strong><br /><span className="text-[#D6F4ED]/60 text-xs">dedikált felület stúdióknak</span></span>
                  </li>
                </ul>
              </div>

              {/* Dev Logs Section */}
              <div className="group relative bg-[#473472] p-8 rounded-3xl border border-[#53629E] shadow-2xl hover:bg-[#53629E] transition-all duration-500 ease-out hover:-translate-y-1 flex flex-col overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 rounded-t-3xl bg-gradient-to-r from-amber-300 to-orange-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="w-14 h-14 rounded-2xl bg-[#D6F4ED]/10 backdrop-blur-sm border border-[#D6F4ED]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                  <HiOutlineTerminal size={28} className="text-amber-300" />
                </div>
                <h3 className="text-2xl font-black mb-4 text-[#D6F4ED] tracking-tight transition-colors duration-300">Fejlesztői Naplók (Dev Logs)</h3>
                <p className="text-[#D6F4ED]/80 leading-relaxed text-[15px] mb-6">
                  Lépj be a kulisszák mögé és fedezd fel, hogyan készülnek kedvenc játékaid! A <strong className="text-[#D6F4ED]">Dev Logs szekció közvetlen betekintést nyújt</strong> a fejlesztők napi munkájába és technikai kihívásaiba.
                </p>
                <ul className="list-none flex flex-col gap-4 mb-2 p-0 mt-auto">
                  <li className="flex items-start gap-3 text-sm text-[#D6F4ED] bg-[#D6F4ED]/5 p-3 rounded-xl hover:bg-[#D6F4ED]/10 transition-colors duration-200 border border-[#D6F4ED]/5">
                    <div className="bg-[#D6F4ED]/10 p-1.5 rounded-lg shrink-0">
                      <HiOutlineLightBulb className="text-amber-300" size={16} />
                    </div>
                    <span className="mt-0.5"><strong className="text-[#D6F4ED]">Koncepciók és ötletek</strong><br /><span className="text-[#D6F4ED]/60 text-xs">korai fázisú bemutatása</span></span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-[#D6F4ED] bg-[#D6F4ED]/5 p-3 rounded-xl hover:bg-[#D6F4ED]/10 transition-colors duration-200 border border-[#D6F4ED]/5">
                    <div className="bg-[#D6F4ED]/10 p-1.5 rounded-lg shrink-0">
                      <SiDevbox className="text-sky-300" size={16} />
                    </div>
                    <span className="mt-0.5"><strong className="text-[#D6F4ED]">Exkluzív tartalom</strong><br /><span className="text-[#D6F4ED]/60 text-xs">közvetlenül az alkotóktól</span></span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-[#D6F4ED] bg-[#D6F4ED]/5 p-3 rounded-xl hover:bg-[#D6F4ED]/10 transition-colors duration-200 border border-[#D6F4ED]/5">
                    <div className="bg-[#D6F4ED]/10 p-1.5 rounded-lg shrink-0">
                      <HiOutlineUsers className="text-emerald-300" size={16} />
                    </div>
                    <span className="mt-0.5"><strong className="text-[#D6F4ED]">Közvetlen kapcsolat</strong><br /><span className="text-[#D6F4ED]/60 text-xs">a fejlesztői közösséggel</span></span>
                  </li>
                </ul>
              </div>

              {/* Community Section */}
              <div className="group relative bg-[#473472] p-8 rounded-3xl border border-[#53629E] shadow-2xl hover:bg-[#53629E] transition-all duration-500 ease-out hover:-translate-y-1 flex flex-col overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 rounded-t-3xl bg-gradient-to-r from-emerald-300 to-teal-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="w-14 h-14 rounded-2xl bg-[#D6F4ED]/10 backdrop-blur-sm border border-[#D6F4ED]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                  <HiOutlineChatAlt2 size={28} className="text-emerald-300" />
                </div>
                <h3 className="text-2xl font-black mb-4 text-[#D6F4ED] tracking-tight transition-colors duration-300">Közösségi Élet és "Backseating"</h3>
                <p className="text-[#D6F4ED]/80 leading-relaxed text-[15px] mb-6">
                  Nálunk a <strong className="text-[#D6F4ED]">backseating nem csak egy kifejezés, hanem közösségi alapérték</strong>. Hiszünk abban, hogy a közös játékélményt a megosztott tudás és a segítő szándék teszi teljessé.
                </p>
                <ul className="list-none flex flex-col gap-4 mb-2 p-0 mt-auto">
                  <li className="flex items-start gap-3 text-sm text-[#D6F4ED] bg-[#D6F4ED]/5 p-3 rounded-xl hover:bg-[#D6F4ED]/10 transition-colors duration-200 border border-[#D6F4ED]/5">
                    <div className="bg-[#D6F4ED]/10 p-1.5 rounded-lg shrink-0">
                      <HiOutlineUsers className="text-sky-300" size={16} />
                    </div>
                    <span className="mt-0.5"><strong className="text-[#D6F4ED]">Aktív Fórum:</strong><br /><span className="text-[#D6F4ED]/60 text-xs">Szólj hozzá a legújabb posztokhoz</span></span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-[#D6F4ED] bg-[#D6F4ED]/5 p-3 rounded-xl hover:bg-[#D6F4ED]/10 transition-colors duration-200 border border-[#D6F4ED]/5">
                    <div className="bg-[#D6F4ED]/10 p-1.5 rounded-lg shrink-0">
                      <HiOutlineLightningBolt className="text-amber-300" size={16} />
                    </div>
                    <span className="mt-0.5"><strong className="text-[#D6F4ED]">Tippek & Trükkök:</strong><br /><span className="text-[#D6F4ED]/60 text-xs">Oszd meg a tudásod másokkal</span></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Games */}
        {activeTab === 'games' && (
          <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            {error && <div className="error-message" style={{ marginBottom: '16px' }}>{error}</div>}

            {loading ? (
              <div className="loading">Játékok betöltése...</div>
            ) : books.length === 0 ? (
              <div className="no-books">Jelenleg nincsenek játékok a katalógusban.</div>
            ) : filteredBooks.length === 0 ? (
              <div className="no-books">Nincs találat a megadott keresésre.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
          </div>
        )}

        {/* Tab Content: Dev Logs */}
        {activeTab === 'devlogs' && (
          <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-1">
              {projectsLoading ? (
                <div className="col-span-full py-20 text-center text-[#87BAC3] font-bold">Betöltés...</div>
              ) : projects.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-[#473472] border border-dashed border-[#53629E] rounded-3xl">
                  <p className="text-[#87BAC3] text-lg">Még nincsenek projektek. Legyél te az első!</p>
                </div>
              ) : (
                projects.map((log) => (
                  <Link
                    to={`/devlogs/${log.id}`}
                    key={log.id}
                    className="group relative flex flex-col bg-[#473472] border border-[#53629E] rounded-3xl overflow-hidden hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all duration-300"
                  >
                    {/* Decorative Image area at the TOP */}
                    <div className="h-48 bg-gradient-to-br from-[#53629E] to-[#473472] flex items-center justify-center relative overflow-hidden shrink-0">
                      {log.imagePath ? (
                        <img
                          src={`http://localhost:3000/uploads/${log.imagePath}`}
                          alt={log.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#87BAC3] via-transparent to-transparent"></div>
                      )}
                      <Gamepad2 size={48} className="text-[#D6F4ED]/20 transform -rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-all duration-500" />
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                          {log.genre}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <h2 className="text-2xl font-black text-[#D6F4ED] mb-3 group-hover:text-[#87BAC3] transition-colors tracking-tighter uppercase">{log.name}</h2>

                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-[#53629E]/50 flex items-center justify-center border border-[#87BAC3]/20">
                          <span className="text-[10px] font-black text-[#87BAC3] uppercase">{log.user?.username?.slice(0, 2) || '??'}</span>
                        </div>
                        <div className="flex flex-col -gap-0.5">
                          <p className="text-[9px] font-black text-[#87BAC3] uppercase tracking-widest leading-none">Fejlesztő</p>
                          <p className="text-xs font-bold text-[#D6F4ED]">{log.user?.username}</p>
                        </div>
                      </div>

                      <div className="bg-[#1a1228]/40 rounded-2xl p-4 mb-6 border border-[#53629E]/20 min-h-[80px] relative overflow-hidden">
                        <p className="text-[#D6F4ED]/70 text-xs leading-relaxed line-clamp-3 italic relative z-10">"{log.description}"</p>
                      </div>

                      <div className="mt-auto pt-4 border-t border-[#53629E]/30 flex items-center justify-between">
                        <span className="text-[10px] font-black text-[#87BAC3] uppercase tracking-[0.2em]">
                          {log._count.devlogentry} bejegyzés
                        </span>
                        <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D6F4ED] text-[#473472] text-[10px] font-black uppercase tracking-widest group-hover:bg-[#87BAC3] group-hover:scale-105 active:scale-95 transition-all">
                          Mutasd <ChevronRight size={12} strokeWidth={3} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <AddToListModal
        isOpen={addListModalOpen}
        onClose={handleCloseAddList}
        onAdd={handleAddBookToList}
        lists={lists}
        bookTitle={selectedBookForList?.title || ''}
        onCreateList={handleCreateList}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
