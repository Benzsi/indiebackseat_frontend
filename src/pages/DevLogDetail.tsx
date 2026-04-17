import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, Clock, Code2, Image as ImageIcon, Send, Layout, Camera, X } from 'lucide-react';
import { BiHeart, BiSolidHeart, BiUpvote, BiSolidUpvote } from "react-icons/bi";
import type { User } from '../services/api';

interface DevLogEntry {
  id: number;
  title: string;
  content: string;
  imagePath?: string;
  createdAt: string;
}

interface DevProject {
  id: number;
  name: string;
  genre: string;
  literaryForm: string;
  description: string;
  imagePath?: string;
  developerId: number;
  developer: { username: string };
  progress: number;
  devlogentry: DevLogEntry[];
  _count: { devlogentry: number; favorites: number; upvotes: number };
}

interface DevLogDetailProps {
  user: User | null;
}

export function DevLogDetail({ user }: DevLogDetailProps) {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<DevProject | null>(null);
  const [loading, setLoading] = useState(true);

  const [entryTitle, setEntryTitle] = useState('');
  const [entryContent, setEntryContent] = useState('');
  const [selectedEntryFile, setSelectedEntryFile] = useState<File | null>(null);

  const projectInputRef = useRef<HTMLInputElement>(null);
  const entryInputRef = useRef<HTMLInputElement>(null);
  const [activeEntryId, setActiveEntryId] = useState<number | null>(null);
  
  const [isFavorited, setIsFavorited] = useState(false);
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [updatingProgress, setUpdatingProgress] = useState(false);

  const fetchProject = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/devlogs/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      }
    } catch (err) {
      console.error('Hiba a projekt lekérésekor:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserInteractions = async () => {
    if (!user || !id) return;
    try {
      const response = await fetch(`http://localhost:3000/api/devlogs/user/${user.id}/lists`);
      if (response.ok) {
        const lists = await response.json();
        const projectId = parseInt(id);
        
        let hasFav = false;
        let hasUp = false;
        
        lists.forEach((list: any) => {
          if (list.name === 'Kedvelt Dev Logok') {
            if (list.items.some((item: any) => item.id === projectId)) hasFav = true;
          } else if (list.name === 'Wishlist Dev Logok') {
            if (list.items.some((item: any) => item.id === projectId)) hasUp = true;
          }
        });
        
        setIsFavorited(hasFav);
        setIsUpvoted(hasUp);
      }
    } catch (err) {
      console.error('Hiba az interakciók betöltésekor:', err);
    }
  };

  useEffect(() => {
    fetchProject();
    if (user) loadUserInteractions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  if (loading) return <div className="py-20 text-center text-[#87BAC3] font-bold animate-pulse">Betöltés...</div>;
  if (!project) return <Navigate to="/devlogs" replace />;

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch(`http://localhost:3000/api/devlogs/${id}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: entryTitle, content: entryContent })
      });

      if (response.ok) {
        const entry = await response.json();

        // Handle image upload if selected
        if (selectedEntryFile) {
          const formData = new FormData();
          formData.append('file', selectedEntryFile);
          await fetch(`http://localhost:3000/api/devlogs/entries/${entry.id}/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });
        }

        setEntryTitle('');
        setEntryContent('');
        setSelectedEntryFile(null);
        fetchProject();
      }
    } catch (err) {
      console.error('Hiba a bejegyzés létrehozásakor:', err);
    }
  };

  const handleUploadEntryImage = async (entryId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch(`http://localhost:3000/api/devlogs/entries/${entryId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        fetchProject();
      }
    } catch (err) {
      console.error('Hiba a kép feltöltésekor:', err);
    }
  };

  const handleUploadProjectImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('authToken');

    try {
      // Assuming back-end has a project image upload endpoint as well
      const response = await fetch(`http://localhost:3000/api/devlogs/${id}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        fetchProject();
      }
    } catch (err) {
      console.error('Hiba a kép feltöltésekor:', err);
    }
  };

  const triggerProjectUpload = () => {
    projectInputRef.current?.click();
  };

  const triggerEntryUpload = (entryId: number) => {
    setActiveEntryId(entryId);
    entryInputRef.current?.click();
  };

  const toggleFavorite = async () => {
    if (!user || !id) return;
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
        setIsFavorited(!isFavorited);
        fetchProject();
      }
    } catch (err) {
      console.error('Hiba a kedvelésnél:', err);
    }
  };

  const toggleUpvote = async () => {
    if (!user || !id) return;
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
        setIsUpvoted(!isUpvoted);
        fetchProject();
      }
    } catch (err) {
      console.error('Hiba a felpontozásnál:', err);
    }
  };

  const handleUpdateProgress = async (progress: number) => {
    if (!id || !isOwner) return;
    const token = localStorage.getItem('authToken');
    try {
      setUpdatingProgress(true);
      const response = await fetch(`http://localhost:3000/api/devlogs/${id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ progress })
      });
      if (response.ok) {
        const updated = await response.json();
        setProject(prev => prev ? { ...prev, progress: updated.progress } : null);
      }
    } catch (err) {
      console.error('Hiba a haladás frissítésekor:', err);
    } finally {
      setUpdatingProgress(false);
    }
  };

  const isOwner = user?.id === project.developerId && user?.role === 'DEVELOPER';

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Hidden inputs for robust click trigger */}
      <input
        ref={projectInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleUploadProjectImage}
      />
      <input
        ref={entryInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => activeEntryId && handleUploadEntryImage(activeEntryId, e)}
      />

      {/* Header / Back */}
      <div className="mb-8">
        <Link
          to="/devlogs"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-extrabold text-[15px] border-2 bg-[#473472] text-[#D6F4ED] border-[#473472] hover:bg-[#53629E] hover:border-[#53629E] hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
        >
          <ArrowLeft size={16} />
          Összes Dev Log
        </Link>
      </div>

      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-[#473472] border border-[#53629E] shadow-2xl mb-12">
        {/* Background pattern/accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#87BAC3]/5 rounded-full blur-3xl transform translate-x-20 -translate-y-20" />

        <div className="relative p-8 md:p-12 flex flex-col md:flex-row gap-8 items-start">
          <div className="relative group/hero">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-[#53629E] flex items-center justify-center shadow-2xl flex-shrink-0 border border-[#87BAC3]/20 overflow-hidden">
              {project.imagePath ? (
                <img 
                  src={
                    project.imagePath.startsWith('http') 
                      ? project.imagePath 
                      : project.imagePath.startsWith('dev_covers')
                        ? `http://localhost:3000/${project.imagePath}`
                        : `http://localhost:3000/uploads/${project.imagePath}`
                  } 
                  alt={project.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <Code2 size={48} className="text-[#D6F4ED]" strokeWidth={1.5} />
              )}
            </div>
            {isOwner && (
              <button
                type="button"
                className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-[#D6F4ED] text-[#473472] shadow-xl hover:bg-[#87BAC3] transition-all cursor-pointer border-2 border-[#473472] z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerProjectUpload();
                }}
                title="Projekt kép feltöltése"
              >
                <Camera size={18} />
              </button>
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/20 text-[10px] font-black uppercase tracking-widest">
                {project.genre}
              </span>
              <span className="inline-block px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/20 text-[10px] font-black uppercase tracking-widest">
                {project.literaryForm}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[#D6F4ED] leading-tight tracking-tight mb-4">{project.name}</h1>
            <div className="flex items-center gap-2 mb-6 text-[#87BAC3] font-bold">
              <div className="w-6 h-6 rounded-full bg-[#87BAC3] text-[#473472] flex items-center justify-center text-[10px]">
                {project.developer?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <span>{project.developer?.username || 'Ismeretlen'} fejlesztői naplója</span>
            </div>
            <p className="text-[#D6F4ED]/80 text-lg leading-relaxed italic border-l-4 border-[#87BAC3] pl-6 py-2 bg-[#53629E]/10 rounded-r-xl max-w-2xl mb-8">
              "{project.description}"
            </p>

            {/* Progress Bar & Slider */}
            <div className="max-w-xl mb-12 space-y-5 bg-[#53629E]/10 p-6 rounded-3xl border border-[#53629E]/20">
              <div className="flex justify-between items-center text-sm font-black text-[#87BAC3] uppercase tracking-[0.2em]">
                <span className="flex items-center gap-2"><Layout size={18} /> A projekt haladása</span>
                <span className="text-[#D6F4ED] text-xl bg-[#473472] px-4 py-1 rounded-xl border border-[#87BAC3]/30 shadow-xl">{project.progress || 0}%</span>
              </div>
              <div className="h-5 w-full bg-black/40 rounded-full overflow-hidden border border-[#53629E]/40 relative shadow-2xl">
                <div 
                  className="h-full bg-gradient-to-r from-[#53629E] via-[#87BAC3] to-[#D6F4ED] transition-all duration-700 ease-out shadow-[0_0_20px_rgba(135,186,195,0.5)]"
                  style={{ width: `${project.progress || 0}%` }}
                />
              </div>
              
              {isOwner && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={project.progress || 0}
                      onChange={(e) => handleUpdateProgress(parseInt(e.target.value))}
                      disabled={updatingProgress}
                      className="flex-1 accent-[#87BAC3] cursor-pointer"
                    />
                    <span className="text-[10px] font-black text-[#87BAC3] uppercase opacity-60">Csúsztasd a módosításhoz</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={toggleFavorite}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl border transition-all active:scale-95 ${isFavorited
                    ? 'bg-rose-500/20 border-rose-400/40 text-rose-400'
                    : 'bg-white/5 border-white/10 text-white/60 hover:border-rose-400/40 hover:text-rose-400'
                  }`}
              >
                {isFavorited ? <BiSolidHeart size={24} /> : <BiHeart size={24} />}
                <span className="text-sm font-black">Kedvelés</span>
              </button>

              <button
                onClick={toggleUpvote}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl border transition-all active:scale-95 ${isUpvoted
                    ? 'bg-amber-500/20 border-amber-400/40 text-amber-400'
                    : 'bg-white/5 border-white/10 text-white/60 hover:border-amber-400/40 hover:text-amber-400'
                  }`}
              >
                {isUpvoted ? <BiSolidUpvote size={24} /> : <BiUpvote size={24} />}
                <span className="text-sm font-black">{project._count?.upvotes || 0} Felpontozás</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Entry Creation Form (Developer Only) */}
      {isOwner && (
        <section className="bg-[#473472] border border-[#53629E] rounded-3xl p-8 mb-16 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#87BAC3] to-[#D6F4ED]" />
          <h2 className="text-xl font-black text-[#D6F4ED] mb-6 flex items-center gap-3">
            <Send size={20} className="text-[#87BAC3]" />
            Új bejegyzés <span className="text-[#87BAC3]">hozzáadása</span>
          </h2>
          <form onSubmit={handleCreateEntry} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#87BAC3] uppercase tracking-widest ml-1">Cím</label>
              <input
                type="text"
                value={entryTitle}
                onChange={(e) => setEntryTitle(e.target.value)}
                placeholder="Pl. Új mechanika implementálva"
                className="w-full bg-[#53629E]/30 border border-[#53629E] text-[#D6F4ED] placeholder-[#87BAC3]/40 rounded-2xl px-5 py-4 text-base outline-none focus:border-[#87BAC3] transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#87BAC3] uppercase tracking-widest ml-1">Tartalom</label>
              <textarea
                value={entryContent}
                onChange={(e) => setEntryContent(e.target.value)}
                placeholder="Írd le a haladást..."
                className="w-full bg-[#53629E]/30 border border-[#53629E] text-[#D6F4ED] placeholder-[#87BAC3]/40 rounded-2xl px-5 py-4 text-base outline-none focus:border-[#87BAC3] transition-all resize-none"
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#87BAC3] uppercase tracking-widest ml-1">Kép hozzáadása (opcionális)</label>
              <div className="flex items-center gap-4 p-4 bg-[#53629E]/20 border border-dashed border-[#53629E] rounded-2xl group hover:border-[#87BAC3] transition-all">
                <div className="relative overflow-hidden cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedEntryFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <button type="button" className="flex items-center gap-2 px-4 py-2 bg-[#53629E]/50 text-[#D6F4ED] rounded-xl text-xs font-bold hover:bg-[#87BAC3] hover:text-[#473472] transition-all">
                    <Camera size={16} />
                    Kép választása
                  </button>
                </div>
                <span className="text-[10px] text-[#87BAC3] font-medium truncate">
                  {selectedEntryFile ? selectedEntryFile.name : 'Nincs fájl kiválasztva'}
                </span>
                {selectedEntryFile && (
                  <button
                    type="button"
                    onClick={() => setSelectedEntryFile(null)}
                    className="ml-auto p-1.5 rounded-full text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="px-8 py-4 rounded-2xl bg-[#D6F4ED] text-[#473472] font-black text-sm hover:bg-[#87BAC3] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#D6F4ED]/10 flex items-center gap-3"
            >
              <Send size={18} />
              Közzététel
            </button>
          </form>
        </section>
      )}

      {/* Entries List */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-6">
          <Layout size={24} className="text-[#87BAC3]" />
          <h2 className="text-2xl font-black text-[#473472] tracking-tight">Bejegyzések</h2>
          <div className="flex-1 h-px bg-[#53629E]/20" />
        </div>

        <div className="space-y-8 relative">
          {/* Vertical line connector */}
          <div className="absolute left-0 sm:left-1/2 top-4 bottom-4 w-px bg-[#53629E]/30 -translate-x-1/2 hidden sm:block" />

          {(!project.devlogentry || project.devlogentry.length === 0) ? (
            <div className="py-20 text-center bg-[#473472] border border-dashed border-[#53629E] rounded-3xl">
              <p className="text-[#87BAC3] font-bold">Még nincsenek bejegyzések.</p>
            </div>
          ) : (
            project.devlogentry.map((entry, idx) => (
              <article
                key={entry.id}
                className={`relative flex flex-col sm:flex-row gap-8 sm:gap-12 animate-in slide-in-from-bottom-5 duration-500`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Visual marker */}
                <div className="absolute left-0 sm:left-1/2 top-0 w-4 h-4 rounded-full bg-[#87BAC3] border-4 border-[#473472] -translate-x-1/2 hidden sm:block z-10" />

                <div className="flex-1 bg-[#473472] border border-[#53629E] rounded-3xl p-6 sm:p-8 hover:border-[#87BAC3]/50 transition-all shadow-lg hover:shadow-xl group">
                  <div className="flex flex-wrap items-center gap-4 mb-6 text-[10px] sm:text-xs">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#53629E]/40 text-[#D6F4ED] font-black uppercase tracking-widest border border-[#53629E]/40">
                      <Tag size={12} className="text-[#87BAC3]" />
                      Frissítés
                    </span>
                    <span className="flex items-center gap-1.5 text-[#87BAC3] font-bold">
                      <Calendar size={12} />
                      {new Date(entry.createdAt).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1.5 text-[#87BAC3] font-bold">
                      <Clock size={12} />
                      ~2 perc olvasás
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-[#D6F4ED] mb-4 group-hover:text-[#87BAC3] transition-colors">{entry.title}</h3>
                  <div className="text-[#D6F4ED]/80 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">{entry.content}</div>

                  {/* Image Display / Upload View */}
                  <div className="mt-8 rounded-2xl bg-gradient-to-br from-[#53629E]/30 to-transparent border border-[#53629E]/40 overflow-hidden relative group/image">
                    {entry.imagePath ? (
                      <div className="relative w-full min-h-[200px]">
                        <img
                          src={
                            entry.imagePath.startsWith('http') 
                              ? entry.imagePath 
                              : entry.imagePath.startsWith('dev_covers')
                                ? `http://localhost:3000/${entry.imagePath}`
                                : `http://localhost:3000/uploads/${entry.imagePath}`
                          }
                          alt={entry.title}
                          className="max-w-full w-auto h-auto object-contain max-h-[600px] mx-auto rounded-xl"
                        />
                        {isOwner && (
                          <button
                            type="button"
                            className="absolute top-4 right-4 p-3 rounded-full bg-black/50 text-white cursor-pointer opacity-0 group-hover/image:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerEntryUpload(entry.id);
                            }}
                          >
                            <Camera size={18} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="h-48 sm:h-64 flex flex-col items-center justify-center p-8 gap-4">
                        <ImageIcon size={48} className="text-[#53629E]/40" />
                        {isOwner && (
                          <button
                            type="button"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#53629E]/30 text-[#87BAC3] hover:bg-[#87BAC3] hover:text-[#473472] transition-all cursor-pointer font-bold text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerEntryUpload(entry.id);
                            }}
                          >
                            <Camera size={16} />
                            Kép feltöltése
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}




