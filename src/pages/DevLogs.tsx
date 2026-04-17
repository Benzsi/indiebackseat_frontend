import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Gamepad2, ChevronRight, Plus, X, Trash2, Camera, Layout } from 'lucide-react';
import { SiDevbox } from "react-icons/si";
import { HiOutlineCollection } from 'react-icons/hi';
import { BiHeart, BiSolidHeart, BiUpvote, BiSolidUpvote } from "react-icons/bi";
import type { User } from '../services/api';

export interface DevLog {
  id: number;
  name: string;
  genre: string;
  literaryForm: string;
  description: string;
  imagePath?: string;
  developer: { username: string };
  developerId: number;
  progress: number;
  _count: { devlogentry: number; favorites: number; upvotes: number };
}

const GENRES = [
  'ACTION', 'PUZZLE', 'RPG', 'PLATFORMER', 'HORROR', 'ADVENTURE', 'SANDBOX',
  'SIMULATION', 'STRATEGY', 'SPORTS', 'RACING', 'FIGHTING', 'SHOOTER',
  'SURVIVAL', 'STEALTH', 'ROGUELIKE', 'MOBA', 'MMORPG', 'TOWER_DEFENSE',
  'PARTY', 'CARD_GAME', 'RHYTHM'
];

const LITERARY_FORMS = [
  'SINGLE_PLAYER', 'MULTIPLAYER', 'CO_OP', 'BATTLE_ROYALE', 'OPEN_WORLD',
  'LINEAR', 'METROIDVANIA', 'SOULSLIKE', 'FIRST_PERSON', 'THIRD_PERSON',
  'VR', 'AUTOSHOOTER', 'TEXT_BASED'
];

interface DevLogsProps {
  user: User | null;
  searchQuery?: string;
  selectedCategory?: string;
  selectedMode?: string;
  selectedRating?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function DevLogs({
  user,
  searchQuery = '',
  selectedCategory = 'Összes',
  selectedMode = 'Összes',
  selectedRating = '',
  sortBy,
  sortOrder
}: DevLogsProps) {
  const [projects, setProjects] = useState<DevLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [wishlisted, setWishlisted] = useState<Set<number>>(new Set());
  const navigate = useNavigate();
  const location = useLocation();

  // Form state
  const [name, setName] = useState('');
  const [genre, setGenre] = useState('ACTION');
  const [literaryForm, setLiteraryForm] = useState('SINGLE_PLAYER');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:3000/api/devlogs');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setProjects(data);
        } else {
          console.error('Hibás adatformátum a devlogoknál:', data);
          setError('Szerver hiba: a kapott adatformátum érvénytelen.');
        }
      } else {
        const err = await response.json().catch(() => ({ message: 'Ismeretlen szerver hiba' }));
        setError(`Szerver hiba történt a projektek betöltésekor: ${err.message || response.statusText}`);
      }
    } catch (err) {
      console.error('Hiba a projektek lekérésekor:', err);
      setError('Nem sikerült csatlakozni a szerverhez. Ellenőrizd, hogy fut-e a backend!');
    } finally {
      setLoading(false);
    }
  };

  const loadUserInteractions = async () => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost:3000/api/devlogs/user/${user.id}/lists`);
      if (response.ok) {
        const lists = await response.json();
        const favs = new Set<number>();
        const wish = new Set<number>();

        lists.forEach((list: any) => {
          if (list.name === 'Kedvelt Dev Logok') {
            list.items.forEach((item: any) => favs.add(item.id));
          } else if (list.name === 'Wishlist Dev Logok') {
            list.items.forEach((item: any) => wish.add(item.id));
          }
        });

        setFavorites(favs);
        setWishlisted(wish);
      }
    } catch (err) {
      console.error('Hiba az interakciók betöltésekor:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
    if (user) loadUserInteractions();

    // Check for create=true in URL to open modal automatically
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true' && user?.role === 'DEVELOPER') {
      setShowModal(true);
      // Clean up the URL to prevent re-opening on refresh
      navigate('/devlogs', { replace: true });
    }
  }, [user, location.search, navigate]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch('http://localhost:3000/api/devlogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, genre, literaryForm, description })
      });

      if (response.ok) {
        const project = await response.json();

        // Handle image upload if selected
        if (selectedFile) {
          const formData = new FormData();
          formData.append('file', selectedFile);
          await fetch(`http://localhost:3000/api/devlogs/${project.id}/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });
        }

        setShowModal(false);
        setName('');
        setGenre('ACTION');
        setLiteraryForm('SINGLE_PLAYER');
        setDescription('');
        setSelectedFile(null);
        fetchProjects();
      }
    } catch (err) {
      console.error('Hiba a projekt létrehozásakor:', err);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm('Biztosan törölni szeretnéd ezt a projektet és minden bejegyzését?')) return;

    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`http://localhost:3000/api/devlogs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchProjects();
      } else {
        const errData = await response.json();
        alert(errData.message || 'Hiba a törlés során');
      }
    } catch (err) {
      console.error('Hiba a törléskor:', err);
    }
  };

  const isDeveloper = user?.role === 'DEVELOPER';
  const isAdmin = user?.role === 'ADMIN';

  const toggleFavorite = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Toggling favorite for project:', id);
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
        setFavorites(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id); else next.add(id);
          return next;
        });
        // fetchProjects(); <-- Removed to prevent jump
      } else {
        const errData = await response.json().catch(() => ({ message: 'Ismeretlen hiba' }));
        alert(`Hiba a mentés során: ${errData.message || response.statusText}`);
      }
    } catch (err) {
      console.error('Hiba a kedvelésnél:', err);
    }
  };

  const toggleWishlist = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Toggling wishlist for project:', id);
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
        const wasWishlisted = wishlisted.has(id);
        setWishlisted(prev => {
          const next = new Set(prev);
          if (wasWishlisted) next.delete(id); else next.add(id);
          return next;
        });

        setProjects(current => current.map(p =>
          p.id === id
            ? { ...p, _count: { ...p._count, upvotes: Math.max(0, (p._count?.upvotes || 0) + (wasWishlisted ? -1 : 1)) } }
            : p
        ));
        // fetchProjects(); <-- Removed to prevent jump
      } else {
        const errData = await response.json().catch(() => ({ message: 'Ismeretlen hiba' }));
        alert(`Hiba a felpontozás során: ${errData.message || response.statusText}`);
      }
    } catch (err) {
      console.error('Hiba a kívánságlistánál:', err);
    }
  };

  const normalizeForSearch = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const normalizedQuery = normalizeForSearch(searchQuery.trim());

  const filteredProjects = projects.filter((project) => {
    const categoryMatch = selectedCategory === 'Összes' || project.genre === selectedCategory;
    if (!categoryMatch) return false;

    const modeMatch = selectedMode === 'Összes' || project.literaryForm === selectedMode;
    if (!modeMatch) return false;

    if (selectedRating !== '') {
      const upvotes = project._count?.upvotes || 0;
      if (selectedRating === '0-10' && (upvotes < 0 || upvotes > 10)) return false;
      if (selectedRating === '10-50' && (upvotes <= 10 || upvotes > 50)) return false;
      if (selectedRating === '50-100' && (upvotes <= 50 || upvotes > 100)) return false;
      if (selectedRating === '100+' && upvotes <= 100) return false;
    }

    if (!normalizedQuery) return true;

    return [project.name, project.description, project.genre, project.literaryForm]
      .some((field) => {
        const normalized = normalizeForSearch(field ?? '');
        return normalized.split(/\s+/).some(word => word.startsWith(normalizedQuery));
      });
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let result = 0;
    if (sortBy === 'abc') result = a.name.localeCompare(b.name);
    else if (sortBy === 'kedvelt') {
      const isAFav = favorites.has(a.id);
      const isBFav = favorites.has(b.id);
      if (isAFav && !isBFav) result = -1;
      else if (!isAFav && isBFav) result = 1;
      else result = a.name.localeCompare(b.name);
    } else if (sortBy === 'wishlist') {
      const countA = a._count?.upvotes || 0;
      const countB = b._count?.upvotes || 0;
      result = countB - countA;
      if (result === 0) result = a.name.localeCompare(b.name);
    } else if (sortBy === 'rating') {
      // DevLogs don't have ratings, but if someone clicks it (shouldn't happen on this page), 
      // we fallback to upvotes or something sensible.
      const countA = a._count?.upvotes || 0;
      const countB = b._count?.upvotes || 0;
      result = countB - countA;
      if (result === 0) result = a.name.localeCompare(b.name);
    }

    return sortOrder === 'asc' ? result : -result;
  });

  return (
    <div className="devlogs-container">
      <div style={{ marginBottom: '32px' }}>
        {/* Navigation Buttons Row - Centered and Linked */}
        <div className="flex justify-center flex-wrap gap-4 mb-6 -mt-5 relative z-30">
          <Link
            to="/"
            className="hanging-tab hanging-tab-lg hanging-tab-inactive"
          >
            <HiOutlineCollection size={20} />
            Játékok
          </Link>

          <Link
            to="/devlogs"
            className="hanging-tab hanging-tab-lg hanging-tab-active"
          >
            <SiDevbox size={20} />
            Dev Logs
          </Link>
        </div>



        {isDeveloper && (
          <div className="flex justify-center mb-6">
            <button
              className="flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl bg-[#473472] text-[#D6F4ED] font-black text-sm hover:bg-[#53629E] transition-all shadow-lg shadow-[#473472]/20 border border-[#53629E]/30"
              onClick={() => setShowModal(true)}
            >
              <Plus size={20} className="text-[#87BAC3]" />
              Új projekt létrehozása
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="glass-modal-overlay">
          <div className="glass-modal-content p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-[#D6F4ED]">Új projekt <span className="text-[#87BAC3]">létrehozása</span></h2>
              <button
                className="p-2 rounded-full text-[#87BAC3] hover:bg-[#53629E]/40 transition-all"
                onClick={() => setShowModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-6">
              <div className="space-y-2">
                <label className="glass-label">Projekt neve</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Pl. Neon Drift"
                  className="glass-input"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="glass-label">Műfaj (Genre)</label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full bg-[#53629E]/30 border border-[#53629E] text-[#D6F4ED] rounded-2xl px-5 py-4 text-sm outline-none focus:border-[#87BAC3] transition-all appearance-none cursor-pointer"
                  >
                    {GENRES.map(g => <option key={g} value={g} className="bg-[#473472]">{g}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="glass-label">Forma (Literary Form)</label>
                  <select
                    value={literaryForm}
                    onChange={(e) => setLiteraryForm(e.target.value)}
                    className="w-full bg-[#53629E]/30 border border-[#53629E] text-[#D6F4ED] rounded-2xl px-5 py-4 text-sm outline-none focus:border-[#87BAC3] transition-all appearance-none cursor-pointer"
                  >
                    {LITERARY_FORMS.map(f => <option key={f} value={f} className="bg-[#473472]">{f}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="glass-label">Rövid leírás</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Miről szól a játékod?"
                  className="glass-input min-h-[120px] resize-none"
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="glass-label">Projekt borítókép</label>
                <div className="flex items-center gap-4 p-4 !bg-[#1a1228]/40 border border-dashed border-[#53629E] rounded-2xl group hover:border-[#D6F4ED] transition-all">
                  <div className="relative overflow-hidden cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <button type="button" className="flex items-center gap-2 px-4 py-2 bg-[#53629E]/50 text-[#D6F4ED] rounded-xl text-xs font-black hover:bg-[#87BAC3] hover:text-[#473472] transition-all uppercase tracking-widest">
                      <Camera size={16} />
                      Kép választása
                    </button>
                  </div>
                  <span className="text-[10px] text-[#87BAC3] font-black uppercase tracking-widest truncate">
                    {selectedFile ? selectedFile.name : 'Nincs fájl kiválasztva'}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 mt-4 rounded-2xl bg-[#D6F4ED] text-[#473472] font-black text-base hover:bg-[#87BAC3] transition-all shadow-lg shadow-[#D6F4ED]/10 active:scale-95"
              >
                Létrehozás
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {error && (
          <div className="col-span-full py-10 px-6 mb-8 text-center bg-red-500/10 border border-red-500/30 rounded-3xl">
            <p className="text-red-300 font-bold mb-4">{error}</p>
            <button
              onClick={fetchProjects}
              className="px-6 py-2 bg-red-500/20 hover:bg-red-500/40 text-white rounded-xl transition-all font-black text-xs uppercase tracking-widest"
            >
              Újrapróbálás
            </button>
          </div>
        )}

        {loading ? (
          <div className="col-span-full py-20 text-center text-[#87BAC3] font-bold">Betöltés...</div>
        ) : sortedProjects.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-[#473472] border border-dashed border-[#53629E] rounded-3xl">
            <p className="text-[#87BAC3] text-lg">Nincs a szűrésnek megfelelő projekt.</p>
          </div>
        ) : (
          sortedProjects.map((log) => (
            <div
              key={log.id}
              onClick={() => navigate(`/devlogs/${log.id}`)}
              className="project-card group"
            >
              {/* Decorative Image area at the TOP */}
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
                  <>
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#87BAC3] via-transparent to-transparent"></div>
                    <Gamepad2 size={48} className="text-[#D6F4ED]/20 transform -rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-all duration-500" />
                  </>
                )}
                {/* Delete button (for admin or owner) */}
                {(isAdmin || (user && user.id === log.developerId)) && (
                  <button
                    onClick={(e) => handleDeleteProject(e, log.id)}
                    className="absolute top-4 right-4 p-3 rounded-2xl bg-red-500/20 border border-red-400/30 text-red-300 hover:bg-red-500/40 hover:text-white transition-all backdrop-blur-xl z-30 shadow-xl"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
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

                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#53629E] flex items-center justify-center border border-[#87BAC3]/40 shadow-lg shrink-0">
                    <span className="text-xs font-black text-[#D6F4ED] uppercase">{log.developer?.username?.slice(0, 2) || '??'}</span>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[8px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Fejlesztő</p>
                    <p className="text-xs font-black text-white tracking-tighter uppercase">{log.developer?.username || 'Ismeretlen'}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="text-[8px] font-black text-white/50 uppercase tracking-[0.3em]">Projekt leírása</div>
                  <div className="description-box">
                    <p className="text-white/80 text-[11px] leading-relaxed line-clamp-3 italic relative z-10">"{log.description}"</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex justify-between items-center text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">
                    <span className="flex items-center gap-1.5"><Layout size={12} className="text-[#87BAC3]" /> Haladás</span>
                    <span className="text-[#D6F4ED] text-xs px-2 py-0.5 rounded-lg bg-[#53629E]/40 border border-[#87BAC3]/20 shadow-inner">{log.progress || 0}%</span>
                  </div>
                  <div className="h-3 w-full bg-[#53629E]/30 rounded-full overflow-hidden border border-[#53629E]/20 relative shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-[#53629E] via-[#87BAC3] to-[#D6F4ED] transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(135,186,195,0.4)]"
                      style={{ width: `${log.progress || 0}%` }}
                    />
                  </div>
                </div>

                <div className="mt-auto pt-3 border-t border-[#53629E]/30 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {/* Favorite (Like) button */}
                    <button
                      onClick={(e) => toggleFavorite(e, log.id)}
                      className={`glass-action-btn ${favorites.has(log.id) ? 'glass-action-btn-active-rose' : ''}`}
                      title="Kedvelés"
                    >
                      {favorites.has(log.id) ? <BiSolidHeart size={20} /> : <BiHeart size={20} />}
                    </button>
                    {/* Upvote button */}
                    <button
                      onClick={(e) => toggleWishlist(e, log.id)}
                      className={`glass-action-btn ${wishlisted.has(log.id) ? 'glass-action-btn-active-amber' : ''}`}
                      title="Felpontozás"
                    >
                      {wishlisted.has(log.id) ? <BiSolidUpvote size={20} /> : <BiUpvote size={20} />}
                      <span className="text-xs font-black">{(log._count.upvotes || 0)}</span>
                    </button>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">
                      {log._count.devlogentry} bejegyzés
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
  );
}




