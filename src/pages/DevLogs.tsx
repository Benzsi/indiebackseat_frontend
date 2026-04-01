import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, ChevronRight, Plus, X, Trash2, Camera } from 'lucide-react';
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
  sortBy,
  sortOrder
}: DevLogsProps) {
  const [projects, setProjects] = useState<DevLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [upvoted, setUpvoted] = useState<Set<number>>(new Set());

  // Form state
  const [name, setName] = useState('');
  const [genre, setGenre] = useState('ACTION');
  const [literaryForm, setLiteraryForm] = useState('SINGLE_PLAYER');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/devlogs');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Hiba a projektek lekérésekor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

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
    if (!user) return;

    const token = localStorage.getItem('authToken');
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
        fetchProjects();
      }
    } catch (err) {
      console.error('Hiba a kedvelésnél:', err);
    }
  };

  const toggleUpvote = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`http://localhost:3000/api/devlogs/${id}/upvote`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setUpvoted(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id); else next.add(id);
          return next;
        });
        fetchProjects();
      }
    } catch (err) {
      console.error('Hiba az upvote-nál:', err);
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

    if (!normalizedQuery) return true;

    return [project.name, project.description, project.genre, project.literaryForm]
      .some((field) => {
        const normalized = normalizeForSearch(field ?? '');
        return normalized.split(/\s+/).some(word => word.startsWith(normalizedQuery));
      });
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let result = 0;
    if (sortBy === 'name') result = a.name.localeCompare(b.name);
    else if (sortBy === 'upvotes') result = (a._count.upvotes || 0) - (b._count.upvotes || 0);
    else if (sortBy === 'entries') result = (a._count.devlogentry || 0) - (b._count.devlogentry || 0);

    return sortOrder === 'asc' ? result : -result;
  });

  return (
    <div className="devlogs-container">
      <div style={{ marginBottom: '32px' }}>
        {/* Navigation Buttons Row - Centered */}
        <div className="flex justify-center flex-wrap gap-4 mb-6 mt-0">
          <Link
            to="/"
            className="flex items-center gap-2 px-8 py-3 rounded-full font-extrabold text-[15px] border-2 bg-[#D6F4ED] text-[#473472] border-[#473472] hover:opacity-90 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <HiOutlineCollection size={20} />
            Játékok
          </Link>

          <Link
            to="/devlogs"
            className="flex items-center gap-2 px-8 py-3 rounded-full font-extrabold text-[15px] border-2 bg-[#473472] text-[#D6F4ED] border-[#473472] hover:bg-[#53629E] hover:border-[#53629E] hover:text-white shadow-[#473472]/20 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <SiDevbox size={18} />
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1a1228]/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-xl bg-[#473472] border border-[#53629E] rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
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
                <label className="text-xs font-bold text-[#87BAC3] uppercase tracking-widest ml-1">Projekt neve</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Pl. Neon Drift"
                  className="w-full bg-[#53629E]/30 border border-[#53629E] text-[#D6F4ED] placeholder-[#87BAC3]/40 rounded-2xl px-5 py-4 text-base outline-none focus:border-[#87BAC3] transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#87BAC3] uppercase tracking-widest ml-1">Műfaj (Genre)</label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full bg-[#53629E]/30 border border-[#53629E] text-[#D6F4ED] rounded-2xl px-5 py-4 text-sm outline-none focus:border-[#87BAC3] transition-all appearance-none cursor-pointer"
                  >
                    {GENRES.map(g => <option key={g} value={g} className="bg-[#473472]">{g}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#87BAC3] uppercase tracking-widest ml-1">Forma (Literary Form)</label>
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
                <label className="text-xs font-bold text-[#87BAC3] uppercase tracking-widest ml-1">Rövid leírás</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Miről szól a játékod?"
                  className="w-full bg-[#53629E]/30 border border-[#53629E] text-[#D6F4ED] placeholder-[#87BAC3]/40 rounded-2xl px-5 py-4 text-base outline-none focus:border-[#87BAC3] transition-all resize-none"
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#87BAC3] uppercase tracking-widest ml-1">Projekt borítókép</label>
                <div className="flex items-center gap-4 p-4 bg-[#53629E]/20 border border-dashed border-[#53629E] rounded-2xl group hover:border-[#87BAC3] transition-all">
                  <div className="relative overflow-hidden cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <button type="button" className="flex items-center gap-2 px-4 py-2 bg-[#53629E]/50 text-[#D6F4ED] rounded-xl text-xs font-bold hover:bg-[#87BAC3] hover:text-[#473472] transition-all">
                      <Camera size={16} />
                      Kép választása
                    </button>
                  </div>
                  <span className="text-[10px] text-[#87BAC3] font-medium truncate">
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
        {loading ? (
          <div className="col-span-full py-20 text-center text-[#87BAC3] font-bold">Betöltés...</div>
        ) : sortedProjects.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-[#473472] border border-dashed border-[#53629E] rounded-3xl">
            <p className="text-[#87BAC3] text-lg">Nincs a szűrésnek megfelelő projekt.</p>
          </div>
        ) : (
          sortedProjects.map((log) => (
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
                  <h2 className="text-lg font-black text-white group-hover:text-white/90 transition-colors tracking-tighter uppercase leading-tight">{log.name}</h2>
                  <div className="flex flex-wrap gap-1.5">
                    <div className="text-[10px] font-bold text-purple-300 uppercase tracking-widest opacity-90 px-2.5 py-1 bg-purple-500/20 self-start rounded-xl border border-purple-400/30">
                      {log.genre}
                    </div>
                    <div className="text-[10px] font-black text-blue-300 uppercase tracking-widest opacity-90 px-2.5 py-1 bg-blue-500/20 self-start rounded-xl border border-blue-400/30">
                      {log.literaryForm}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#53629E] flex items-center justify-center border border-[#87BAC3]/40 shadow-lg shrink-0">
                    <span className="text-xs font-black text-[#D6F4ED] uppercase">{log.developer.username.slice(0, 2)}</span>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[8px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Fejlesztő</p>
                    <p className="text-xs font-black text-white tracking-tighter uppercase">{log.developer.username}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="text-[8px] font-black text-white/50 uppercase tracking-[0.3em]">Projekt leírása</div>
                  <div className="bg-[#1a1228]/40 rounded-2xl p-3 border border-white/10 min-h-[60px] relative overflow-hidden group-hover:border-white/20 transition-all">
                    <p className="text-white/80 text-[11px] leading-relaxed line-clamp-3 italic relative z-10">"{log.description}"</p>
                  </div>
                </div>

                <div className="mt-auto pt-3 border-t border-[#53629E]/30 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {/* Favorite button */}
                    <button
                      onClick={(e) => toggleFavorite(e, log.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border transition-all active:scale-95 ${favorites.has(log.id)
                        ? 'bg-rose-500/20 border-rose-400/40 text-rose-400'
                        : 'bg-white/5 border-white/10 text-white/60 hover:border-rose-400/40 hover:text-rose-400'
                        }`}
                    >
                      {favorites.has(log.id)
                        ? <BiSolidHeart size={24} />
                        : <BiHeart size={24} />}
                    </button>
                    {/* Upvote button */}
                    <button
                      onClick={(e) => toggleUpvote(e, log.id)}
                      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all active:scale-95 ${upvoted.has(log.id)
                        ? 'bg-amber-500/20 border-amber-400/40 text-amber-400'
                        : 'bg-white/5 border-white/10 text-white/60 hover:border-amber-400/40 hover:text-amber-400'
                        }`}
                    >
                      {upvoted.has(log.id)
                        ? <BiSolidUpvote size={24} />
                        : <BiUpvote size={24} />}
                      {(log._count.upvotes || 0) > 0 && (
                        <span className="text-xs font-black text-white">{log._count.upvotes}</span>
                      )}
                    </button>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">
                      {log._count.devlogentry} bejegyzés
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-[#473472] text-[10px] font-black uppercase tracking-widest group-hover:bg-white/90 group-hover:scale-105 active:scale-95 transition-all">
                    Mutasd <ChevronRight size={14} strokeWidth={3} />
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
