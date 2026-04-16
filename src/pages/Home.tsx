import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Gamepad2, ChevronRight, HelpCircle } from 'lucide-react';
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
import { BiHeart, BiSolidHeart, BiUpvote, BiSolidUpvote } from "react-icons/bi";
import type { User } from '../services/api';
import { GamesService, RatingsService } from '../services/api';
import { GameCard } from '../components/GameCard';
import type { GameWithRating } from '../components/GameCard';
import { AddToListModal } from '../components/AddToListModal';
import { getListsForUser, createListForUser, addGameToList } from '../services/lists';
import type { GameList } from '../services/lists';

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
  const [games, setGames] = useState<GameWithRating[]>([]);
  const [projects, setProjects] = useState<DevLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredGameId, setHoveredGameId] = useState<number | null>(null);
  const [addListModalOpen, setAddListModalOpen] = useState(false);
  const [lists, setLists] = useState<GameList[]>([]);
  const [selectedGameForList, setSelectedGameForList] = useState<GameWithRating | null>(null);
  const [specialListsGames, setSpecialListsGames] = useState<{ favorites: Set<number>, wishlist: Set<number> }>({
    favorites: new Set(),
    wishlist: new Set()
  });

  const [devFavorites, setDevFavorites] = useState<Set<number>>(new Set());
  const [devUpvoted, setDevUpvoted] = useState<Set<number>>(new Set());
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  // Handle hash scroll
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash.substring(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 0);
    }
  }, [window.location.hash]);

  // Handle hash scroll and tab switching
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash === '#faq' || hash === '#how-it-works')) {
      // Ensure we are on overview tab to see these sections
      setActiveTab('overview');
      
      setTimeout(() => {
        const element = document.getElementById(hash.substring(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [window.location.hash, setActiveTab]);
  
  const gamesService = new GamesService();
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

  const loadProjectInteractions = async () => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost:3000/api/devlogs/user/${user.id}/lists`);
      if (response.ok) {
        const lists = await response.json();
        const favs = new Set<number>();
        const up = new Set<number>();
        
        lists.forEach((list: any) => {
          if (list.name === 'Kedvelt Dev Logok') {
            list.items.forEach((item: any) => favs.add(item.id));
          } else if (list.name === 'Wishlist Dev Logok') {
            list.items.forEach((item: any) => up.add(item.id));
          }
        });
        
        setDevFavorites(favs);
        setDevUpvoted(up);
      }
    } catch (err) {
      console.error('Hiba a projekt interakciók lekérésekor:', err);
    }
  };

  useEffect(() => {
    if (user) {
      void fetchGames();
      void loadUserLists(String(user.id));
      void fetchProjects();
      void loadProjectInteractions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadUserLists = async (userId: string) => {
    const userLists = await getListsForUser(userId);
    setLists(userLists);

    // Identify Games in "Kedveltek" and "Wishlist"
    const favs = new Set<number>();
    const wish = new Set<number>();

    userLists.forEach(list => {
      if (list.name === 'Kedveltek') {
        list.items?.forEach(item => item.game && favs.add(item.game.id));
      } else if (list.name === 'Wishlist') {
        list.items?.forEach(item => item.game && wish.add(item.game.id));
      }
    });

    setSpecialListsGames({ favorites: favs, wishlist: wish });
  };

  const toggleDevFavorite = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Home: Toggling Dev Favorite:', id);
    if (!user) {
      alert('A kedveléshez jelentkezz be!');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('A folytatáshoz jelentkezz be újra!');
      return;
    }
    try {
      const response = await fetch(`http://localhost:3000/api/devlogs/${id}/favorite`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setDevFavorites(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id); else next.add(id);
          return next;
        });
        // fetchProjects(); <-- Fixed jump
      } else {
        const errData = await response.json().catch(() => ({ message: 'Ismeretlen hiba' }));
        alert(`Hiba: ${errData.message || response.statusText}`);
      }
    } catch (err) {
      console.error('Hiba a kedvelésnél:', err);
    }
  };

  const toggleDevUpvote = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Home: Toggling Dev Upvote:', id);
    if (!user) {
      alert('A felpontozáshoz jelentkezz be!');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('A folytatáshoz jelentkezz be újra!');
      return;
    }
    try {
      const response = await fetch(`http://localhost:3000/api/devlogs/${id}/wishlist`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setDevUpvoted(prev => {
          const next = new Set(prev);
          const wasUpvoted = next.has(id);
          if (wasUpvoted) next.delete(id); else next.add(id);

          setProjects(current => current.map(p => 
            p.id === id 
              ? { ...p, _count: { ...p._count, upvotes: Math.max(0, (p._count?.upvotes || 0) + (wasUpvoted ? -1 : 1)) } }
              : p
          ));

          return next;
        });
        // fetchProjects();
      } else {
        const errData = await response.json().catch(() => ({ message: 'Ismeretlen hiba' }));
        alert(`Hiba: ${errData.message || response.statusText}`);
      }
    } catch (err) {
      console.error('Hiba a felpontozásnál:', err);
    }
  };

  const fetchGames = async () => {
    setLoading(true);
    try {
      const data = await gamesService.getAllGames();

      const gamesWithRatings = await Promise.all(
        data.map(async (game) => {
          try {
            const gameRating = await ratingsService.getGameRating(game.id);
            return {
              ...game,
              averageRating: gameRating.averageRating || 0,
              totalRatings: gameRating.totalRatings || 0,
            };
          } catch {
            return {
              ...game,
              averageRating: 0,
              totalRatings: 0,
            };
          }
        })
      );

      setGames(gamesWithRatings);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Játékok lekérése sikertelen');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddList = (game: GameWithRating) => {
    setSelectedGameForList(game);
    setAddListModalOpen(true);
  };
  const handleCloseAddList = () => {
    setAddListModalOpen(false);
    setSelectedGameForList(null);
  };
  const handleAddGameToList = async (listId: number) => {
    if (user && selectedGameForList) {
      try {
        await addGameToList(listId, selectedGameForList.id);
        await loadUserLists(String(user.id));
        setAddListModalOpen(false);
        setSelectedGameForList(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'A játék listához adása sikertelen');
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

  const handleToggleSpecialList = async (game: GameWithRating, listName: string) => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost:3000/api/lists/${user.id}/toggle-special`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id, listName })
      });
      if (response.ok) {
        await loadUserLists(String(user.id));
      }
    } catch (err) {
      console.error('Hiba a speciális lista váltásakor:', err);
    }
  };

  const normalizeForSearch = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const normalizedQuery = normalizeForSearch(searchQuery.trim());

  const filteredGames = games.filter((game) => {
    const categoryMatch = selectedCategory === 'Összes' || game.genre === selectedCategory;
    if (!categoryMatch) return false;

    const modeMatch = selectedMode === 'Összes' || game.literaryForm === selectedMode;
    if (!modeMatch) return false;

    if (selectedRating !== '') {
      const avg = game.averageRating || 0;
      if (selectedRating === '4-5' && (avg < 4 || avg > 5)) return false;
      if (selectedRating === '3-4' && (avg < 3 || avg >= 4)) return false;
      if (selectedRating === '2-3' && (avg < 2 || avg >= 3)) return false;
      if (selectedRating === '1-2' && (avg < 1 || avg >= 2)) return false;
    }

    if (!normalizedQuery) return true;

    return [game.title, game.author, game.genre, game.literaryForm]
      .some((field) => {
        const normalized = normalizeForSearch(field ?? '');
        return normalized.split(/\s+/).some(word => word.startsWith(normalizedQuery));
      });
  }).sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'abc') {
      comparison = (a.title || '').localeCompare(b.title || '');
    } else if (sortBy === 'kedvelt') {
      const isAFav = specialListsGames.favorites.has(a.id);
      const isBFav = specialListsGames.favorites.has(b.id);
      if (isAFav && !isBFav) comparison = -1;
      else if (!isAFav && isBFav) comparison = 1;
      else comparison = (a.title || '').localeCompare(b.title || ''); // sub-sort by name
    } else if (sortBy === 'wishlist') {
      const isAWish = specialListsGames.wishlist.has(a.id);
      const isBWish = specialListsGames.wishlist.has(b.id);
      if (isAWish && !isBWish) comparison = -1;
      else if (!isAWish && isBWish) comparison = 1;
      else comparison = (a.title || '').localeCompare(b.title || '');
    } else if (sortBy === 'rating') {
      comparison = (b.averageRating || 0) - (a.averageRating || 0);
      if (comparison === 0) comparison = (a.title || '').localeCompare(b.title || '');
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const filteredProjects = projects.filter((project) => {
    const categoryMatch = selectedCategory === 'Összes' || project.genre === selectedCategory;
    if (!categoryMatch) return false;

    const modeMatch = selectedMode === 'Összes' || project.literaryForm === selectedMode;
    if (!modeMatch) return false;

    if (activeTab === 'devlogs' && selectedRating !== '') {
      const upvotes = project._count?.upvotes || 0;
      if (selectedRating === '0-10' && (upvotes < 0 || upvotes > 10)) return false;
      if (selectedRating === '10-50' && (upvotes <= 10 || upvotes > 50)) return false;
      if (selectedRating === '50-100' && (upvotes <= 50 || upvotes > 100)) return false;
      if (selectedRating === '100+' && upvotes <= 100) return false;
    }

    if (!normalizedQuery) return true;

    return [project.name, project.genre, project.literaryForm]
      .some((field) => normalizeForSearch(field ?? '').split(/\s+/).some(word => word.startsWith(normalizedQuery)));
  }).sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'abc') {
      comparison = (a.name || '').localeCompare(b.name || '');
    } else if (sortBy === 'kedvelt') {
      const isAFav = devFavorites.has(a.id);
      const isBFav = devFavorites.has(b.id);
      if (isAFav && !isBFav) comparison = -1;
      else if (!isAFav && isBFav) comparison = 1;
      else comparison = (a.name || '').localeCompare(b.name || '');
    } else if (sortBy === 'wishlist') {
      const countA = a._count?.upvotes || 0;
      const countB = b._count?.upvotes || 0;
      comparison = countB - countA;
      if (comparison === 0) comparison = (a.name || '').localeCompare(b.name || '');
    }

    return sortOrder === 'asc' ? comparison : -comparison;
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
        
        {/* Hogyan működik Section (Unauthenticated) */}
        <div id="how-it-works" className="mt-12 p-10 rounded-3xl bg-[#473472] border border-[#53629E] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D6F4ED]/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-black text-[#D6F4ED] mb-10 flex items-center gap-3 tracking-tight">
              <HiOutlineLightBulb className="text-[#87BAC3]" /> Hogyan működik az indie.backseat?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { 
                  title: "1. Fedezd fel a legújabb indie kincseket", 
                  text: "Merülj el a folyamatosan bővülő játék-katalógusunkban, ahol kézzel válogatott, minőségi független projekteket találsz. Ne csak a kész játékokat nézd: böngéssz a fejlesztői naplók (Dev Logs) között is, hogy lásd a projektek formálódását az ötlettől a megvalósításig." 
                },
                { 
                  title: "2. Kövesd és építsd a gyűjteményed", 
                  text: "Találtál valamit, ami tetszik? Add hozzá a személyes várólistádhoz vagy jelöld kedvencnek egyetlen kattintással. Hozz létre egyedi listákat a gyűjteményed rendszerezéséhez, így sosem maradsz le a legfontosabb frissítésekről és mérföldkövekről." 
                },
                { 
                  title: "3. Támogasd a fejlesztőket (Backseating)", 
                  text: "A visszajelzésed aranyat ér! Csatlakozz a párbeszédhez a fejlesztői naplók alatt, tegyél fel kérdéseket, vagy tegyél javaslatokat a játékmenetre vonatkozóan. Ez a közvetlen segítés segít az alkotóknak, hogy a lehető legjobb élményt fejlesszék ki." 
                },
                { 
                  title: "4. Építsd az indie közösséget", 
                  text: "Oszd meg tapasztalataidat a közösséggel csillag alapú értékelésekkel és véleményekkel. Segíts más játékosoknak megtalálni a következő kedvencüket, és járulj hozzá az indie stúdiók sikeréhez és láthatóságához a platformon." 
                }
              ].map((step, idx) => (
                <div key={idx} className="flex flex-col gap-4 p-6 rounded-2xl bg-[#D6F4ED]/5 border border-[#D6F4ED]/10 backdrop-blur-md hover:bg-[#D6F4ED]/10 transition-all duration-300">
                  <h4 className="text-lg font-black text-[#87BAC3] uppercase tracking-tighter">{step.title}</h4>
                  <p className="text-[#D6F4ED]/80 text-sm md:text-[15px] leading-relaxed font-medium">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Section (Unauthenticated) */}
        <div id="faq" className="mt-12 p-10 rounded-3xl bg-[#473472] border border-[#53629E] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#87BAC3]/5 rounded-full blur-3xl -ml-32 -mt-32"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-black text-[#D6F4ED] mb-10 flex items-center gap-3 tracking-tight">
              <HelpCircle className="text-[#87BAC3]" /> Gyakori Kérdések
            </h2>
            <div className="flex flex-col gap-4">
              {[
                { 
                  q: "Ki láthatja a Dev Logjaimat?", 
                  a: "A publikált Dev Logokat minden látogató láthatja a platformon, de csak regisztrált felhasználók tudnak felpontozni vagy hozzászólni az egyes bejegyzésekhez." 
                },
                { 
                  q: "Milyen gyakran érdemes frissíteni a naplómat?", 
                  a: "Nincs kötött szabály, de a legsikeresebb projektek hetente vagy kéthetente tesznek közzé új bejegyzést, hogy fenntartsák a közösség érdeklődését." 
                },
                { 
                  q: "Milyen fájlformátumokat támogattok a képeknél?", 
                  a: "Jelenleg a JPG, PNG és WebP formátumokat támogatjuk. A maximális fájlméret 10MB, a képek pedig automatikusan optimalizálva jelennek meg." 
                },
                { 
                  q: "Hogyan érhetem el a fejlesztőket?", 
                  a: "Minden bejegyzés alatt találsz egy hozzászólási szekciót, ahol közvetlenül kérdezhetsz az alkotótól, vagy csatlakozhatsz a Discord szerverünkhöz." 
                },
                { 
                  q: "Van lehetőség a bejegyzések utólagos szerkesztésére?", 
                  a: "Igen, a készítő bármikor módosíthatja a projekt leírását vagy a bejegyzések tartalmát a saját profilján keresztül, így a napló mindig naprakész marad." 
                }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer ${
                    activeFaqIndex === idx 
                      ? 'bg-[#D6F4ED]/10 border-[#87BAC3]/40' 
                      : 'bg-[#D6F4ED]/5 border-[#D6F4ED]/10 hover:bg-[#D6F4ED]/8'
                  }`}
                  onClick={() => setActiveFaqIndex(activeFaqIndex === idx ? null : idx)}
                >
                  <div className="p-6 flex items-center justify-between">
                    <h4 className="text-sm font-black text-[#87BAC3] uppercase tracking-widest">{item.q}</h4>
                    <ChevronRight 
                      size={18} 
                      className={`text-[#87BAC3] transition-transform duration-300 ${activeFaqIndex === idx ? 'rotate-90' : ''}`} 
                    />
                  </div>
                  <div 
                    className={`transition-all duration-300 ease-in-out ${
                      activeFaqIndex === idx ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="px-6 pb-6 text-[#D6F4ED]/80 text-[13px] leading-relaxed font-medium">{item.a}</p>
                  </div>
                </div>
              ))}
            </div>
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

        {/* Navigation Buttons Row - Centered and Separated */}
        <div className="flex justify-center flex-wrap gap-4 mb-6 -mt-5 relative z-30">
          <button
            onClick={() => setActiveTab('games')}
            className={`hanging-tab hanging-tab-lg ${activeTab === 'games' ? 'hanging-tab-active' : 'hanging-tab-inactive'}`}
          >
            <HiOutlineCollection size={20} />
            Játékok
          </button>

          <button
            onClick={() => setActiveTab('devlogs')}
            className={`hanging-tab hanging-tab-lg ${activeTab === 'devlogs' ? 'hanging-tab-active' : 'hanging-tab-inactive'}`}
          >
            <SiDevbox size={20} />
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

            {/* Global Informational Sections (Back inside overview) */}
            <div id="how-it-works" className="mt-12 p-10 rounded-3xl bg-[#473472] border border-[#53629E] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D6F4ED]/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="relative z-10">
                <h2 className="text-4xl font-black text-[#D6F4ED] mb-10 flex items-center gap-3 tracking-tight">
                  <HiOutlineLightBulb className="text-[#87BAC3]" /> Hogyan működik az indie.backseat?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { 
                      title: "1. Fedezd fel a legújabb indie kincseket", 
                      text: "Merülj el a folyamatosan bővülő játék-katalógusunkban, ahol kézzel válogatott, minőségi független projekteket találsz. Ne csak a kész játékokat nézd: böngéssz a fejlesztői naplók (Dev Logs) között is, hogy lásd a projektek formálódását az ötlettől a megvalósításig." 
                    },
                    { 
                      title: "2. Kövesd és építsd a gyűjteményed", 
                      text: "Találtál valamit, ami tetszik? Add hozzá a személyes várólistádhoz vagy jelöld kedvencnek egyetlen kattintással. Hozz létre egyedi listákat a gyűjteményed rendszerezéséhez, így sosem maradsz le a legfontosabb frissítésekről és mérföldkövekről." 
                    },
                    { 
                      title: "3. Támogasd a fejlesztőket (Backseating)", 
                      text: "A visszajelzésed aranyat ér! Csatlakozz a párbeszédhez a fejlesztői naplók alatt, tegyél fel kérdéseket, vagy tegyél javaslatokat a játékmenetre vonatkozóan. Ez a közvetlen segítés segít az alkotóknak, hogy a lehető legjobb élményt fejlesszék ki." 
                    },
                    { 
                      title: "4. Építsd az indie közösséget", 
                      text: "Oszd meg tapasztalataidat a közösséggel csillag alapú értékelésekkel és véleményekkel. Segíts más játékosoknak megtalálni a következő kedvencüket, és járulj hozzá az indie stúdiók sikeréhez és láthatóságához a platformon." 
                    }
                  ].map((step, idx) => (
                    <div key={idx} className="flex flex-col gap-4 p-6 rounded-2xl bg-[#D6F4ED]/5 border border-[#D6F4ED]/10 backdrop-blur-md hover:bg-[#D6F4ED]/10 transition-all duration-300">
                      <h4 className="text-lg font-black text-[#87BAC3] uppercase tracking-tighter">{step.title}</h4>
                      <p className="text-[#D6F4ED]/80 text-sm md:text-[15px] leading-relaxed font-medium">{step.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div id="faq" className="mt-12 p-10 rounded-3xl bg-[#473472] border border-[#53629E] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-[#87BAC3]/5 rounded-full blur-3xl -ml-32 -mt-32"></div>
              <div className="relative z-10">
                <h2 className="text-4xl font-black text-[#D6F4ED] mb-10 flex items-center gap-3 tracking-tight">
                  <HelpCircle className="text-[#87BAC3]" /> Gyakori Kérdések
                </h2>
                <div className="flex flex-col gap-4">
                  {[
                    { 
                      q: "Ki láthatja a Dev Logjaimat?", 
                      a: "A publikált Dev Logokat minden látogató láthatja a platformon, de csak regisztrált felhasználók tudnak felpontozni vagy hozzászólni az egyes bejegyzésekhez." 
                    },
                    { 
                      q: "Milyen gyakran érdemes frissíteni a naplómat?", 
                      a: "Nincs kötött szabály, de a legsikeresebb projektek hetente vagy kéthetente tesznek közzé új bejegyzést, hogy fenntartsák a közösség érdeklődését." 
                    },
                    { 
                      q: "Milyen fájlformátumokat támogattok a képeknél?", 
                      a: "Jelenleg a JPG, PNG és WebP formátumokat támogatjuk. A maximális fájlméret 10MB, a képek pedig automatikusan optimalizálva jelennek meg." 
                    },
                    { 
                      q: "Hogyan érhetem el a fejlesztőket?", 
                      a: "Minden bejegyzés alatt találsz egy hozzászólási szekciót, ahol közvetlenül kérdezhetsz az alkotótól, vagy csatlakozhatsz a Discord szerverünkhöz." 
                    },
                    { 
                      q: "Van lehetőség a bejegyzések utólagos szerkesztésére?", 
                      a: "Igen, a készítő bármikor módosíthatja a projekt leírását vagy a bejegyzések tartalmát a saját profilján keresztül, így a napló mindig naprakész marad." 
                    }
                  ].map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer ${
                        activeFaqIndex === idx 
                          ? 'bg-[#D6F4ED]/10 border-[#87BAC3]/40' 
                          : 'bg-[#D6F4ED]/5 border-[#D6F4ED]/10 hover:bg-[#D6F4ED]/8'
                      }`}
                      onClick={() => setActiveFaqIndex(activeFaqIndex === idx ? null : idx)}
                    >
                      <div className="p-6 flex items-center justify-between">
                        <h4 className="text-sm font-black text-[#87BAC3] uppercase tracking-widest">{item.q}</h4>
                        <ChevronRight 
                          size={18} 
                          className={`text-[#87BAC3] transition-transform duration-300 ${activeFaqIndex === idx ? 'rotate-90' : ''}`} 
                        />
                      </div>
                      <div 
                        className={`transition-all duration-300 ease-in-out ${
                          activeFaqIndex === idx ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <p className="px-6 pb-6 text-[#D6F4ED]/80 text-[13px] leading-relaxed font-medium">{item.a}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
            ) : games.length === 0 ? (
              <div className="no-games">Jelenleg nincsenek játékok a katalógusban.</div>
            ) : filteredGames.length === 0 ? (
              <div className="no-games">Nincs találat a megadott keresésre.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredGames.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    isHovered={hoveredGameId === game.id}
                    onMouseEnter={() => setHoveredGameId(game.id)}
                    onMouseLeave={() => setHoveredGameId(null)}
                    onOpenAddList={handleOpenAddList}
                    onToggleFavorite={(b) => handleToggleSpecialList(b, 'Kedveltek')}
                    onToggleWishlist={(b) => handleToggleSpecialList(b, 'Wishlist')}
                    isFavorited={specialListsGames.favorites.has(game.id)}
                    isWishlisted={specialListsGames.wishlist.has(game.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Dev Logs */}
        {activeTab === 'devlogs' && (
          <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            {user?.role === 'DEVELOPER' && (
              <div className="flex justify-center mb-10">
                <button
                  className="flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl bg-[#473472] text-[#D6F4ED] font-black text-sm hover:bg-[#53629E] transition-all shadow-lg shadow-[#473472]/20 border border-[#53629E]/30"
                  onClick={() => navigate('/devlogs?create=true')}
                >
                  <SiDevbox size={20} className="text-[#87BAC3]" />
                  Új projekt létrehozása
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-1">
            {projectsLoading ? (
              <div className="col-span-full py-20 text-center text-[#87BAC3] font-bold">Betöltés...</div>
            ) : projects.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-[#473472] border border-dashed border-[#53629E] rounded-3xl">
                <p className="text-[#87BAC3] text-lg">Még nincsenek projektek.</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-[#473472] border border-dashed border-[#53629E] rounded-3xl">
                <p className="text-[#87BAC3] text-lg">Nincs a szűrésnek megfelelő projekt.</p>
              </div>
            ) : (
              filteredProjects.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => navigate(`/devlogs/${log.id}`)}
                    className="project-card group"
                  >
                    <div className="project-card-image-wrapper">
                      {log.imagePath ? (
                        <img
                          src={
                            log.imagePath.startsWith('http') 
                              ? log.imagePath 
                              : log.imagePath.startsWith('dev_covers')
                                ? `http://localhost:3000/${log.imagePath}`
                                : `http://localhost:3000/uploads/${log.imagePath}`
                          }
                          alt={log.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#87BAC3] via-transparent to-transparent"></div>
                      )}
                      <Gamepad2 size={48} className="text-[#D6F4ED]/20 transform -rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-all duration-500" />
                    </div>

                    <div className="p-5 flex-1 flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <h2 className="text-xl font-black text-[#D6F4ED] group-hover:text-white transition-colors tracking-tighter uppercase leading-tight">{log.name}</h2>
                        <div className="flex flex-wrap gap-1.5">
                          <div className="glass-badge glass-badge-purple">
                            {log.genre}
                          </div>
                          <div className="glass-badge glass-badge-blue">
                            {log.literaryForm}
                          </div>
                        </div>
                      </div>

                      <div className="developer-pill">
                        <div className="developer-avatar">
                          <span className="text-xs font-black text-[#D6F4ED] uppercase">{(log.user?.username || '??').slice(0, 2)}</span>
                        </div>
                        <div className="flex flex-col">
                          <p className="text-[8px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Fejlesztő</p>
                          <p className="text-xs font-black text-white tracking-tighter uppercase">{log.user?.username}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="text-[8px] font-black text-white/50 uppercase tracking-[0.3em]">Projekt leírása</div>
                        <div className="description-box">
                          <p className="text-white/80 text-[11px] leading-relaxed line-clamp-3 italic relative z-10">"{log.description}"</p>
                        </div>
                      </div>

                      <div className="mt-auto pt-3 border-t border-[#53629E]/30 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => toggleDevFavorite(e, log.id)}
                            className={`glass-action-btn ${devFavorites.has(log.id) ? 'glass-action-btn-active-rose' : ''}`}
                          >
                            {devFavorites.has(log.id) ? <BiSolidHeart size={20} /> : <BiHeart size={20} />}
                          </button>
                          <button
                            onClick={(e) => toggleDevUpvote(e, log.id)}
                            className={`glass-action-btn ${devUpvoted.has(log.id) ? 'glass-action-btn-active-amber' : ''}`}
                          >
                            {devUpvoted.has(log.id) ? <BiSolidUpvote size={20} /> : <BiUpvote size={20} />}
                            <span className="text-xs font-black">{log._count?.upvotes || 0}</span>
                          </button>
                          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">
                            {log._count?.devlogentry || 0} bejegyzés
                          </span>
                        </div>
                        <div className="primary-btn-pill">
                          Mutasd <ChevronRight size={14} strokeWidth={3} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <AddToListModal
        isOpen={addListModalOpen}
        onClose={handleCloseAddList}
        onAdd={handleAddGameToList}
        lists={lists}
        GameTitle={selectedGameForList?.title || ''}
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




