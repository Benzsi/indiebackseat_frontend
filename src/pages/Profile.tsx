import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { User } from '../services/api';
import { UsersService, AuthService } from '../services/api';
import { User as UserIcon, Mail, Shield, Calendar, Edit2, ArrowLeft, LogOut, Check, X } from 'lucide-react';
import { FaSteam } from "react-icons/fa";

interface ProfileProps {
  user: User | null;
  onUserUpdate?: (user: User) => void;
}

export function Profile({ user, onUserUpdate }: ProfileProps) {
  const [username, setUsername] = useState(user?.username || '');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [steamMessage, setSteamMessage] = useState<{text: string; type: 'success' | 'error'} | null>(null);
  const usersService = new UsersService();
  const authService = new AuthService();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const successParam = params.get('steam_linked');
    const errorParam = params.get('error');

    if (successParam === 'success') {
      setSteamMessage({ text: 'A Steam fiókod sikeresen csatolva lett!', type: 'success' });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (errorParam) {
      setSteamMessage({ text: 'Hiba történt a Steam fiók csatolása során. Próbáld újra!', type: 'error' });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSteamConnect = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) { alert('Nem vagy bejelentkezve!'); return; }
    
    setLoading(true);
    try {
      const { hasKey } = await authService.checkSteamKey();
      if (!hasKey) {
        setSteamMessage({ 
          text: 'Nincs megadva Steam API kulcs! Regisztrálj egyet itt: https://steamcommunity.com/dev/apikey', 
          type: 'error' 
        });
        return;
      }
      window.location.href = `http://localhost:3000/api/auth/steam?token=${token}`;
    } catch (err) {
      setSteamMessage({ text: 'Hiba történt a Steam ellenőrzése során.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSteamDisconnect = async () => {
    if (!window.confirm('Biztosan le szeretnéd választani a Steam fiókodat?')) return;
    setLoading(true);
    try {
      const { user: updatedUser } = await authService.unlinkSteam();
      setSteamMessage({ text: 'A Steam fiókod sikeresen le lett választva!', type: 'success' });
      if (onUserUpdate) onUserUpdate(updatedUser);
    } catch (err) {
      setSteamMessage({ text: err instanceof Error ? err.message : 'Hiba történt.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-[#473472] rounded-3xl border border-[#53629E] shadow-2xl p-10 text-center max-w-sm w-full">
          <UserIcon size={48} className="text-[#87BAC3] mx-auto mb-4" />
          <h2 className="text-2xl font-black text-[#D6F4ED] mb-2">Bejelentkezés szükséges</h2>
          <p className="text-[#87BAC3] mb-6 text-sm">Kérlek jelentkezz be a profil megtekintéséhez.</p>
          <Link to="/login" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#D6F4ED] text-[#473472] font-black text-sm hover:bg-[#87BAC3] transition-all">
            Bejelentkezés
          </Link>
        </div>
      </div>
    );
  }

  const handleUpdateUsername = async () => {
    setError('');
    const trimmed = username.trim();
    if (!trimmed || trimmed.length < 3 || trimmed.length > 32) {
      setError('A felhasználónév 3-32 karakter közötti kell legyen');
      return;
    }
    setLoading(true);
    try {
      const updated = await usersService.updateUser(user.id, { username: trimmed });
      setIsEditingUsername(false);
      setSuccess('Felhasználónév sikeresen frissítve!');
      if (onUserUpdate) onUserUpdate(updated);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Felhasználónév frissítése sikertelen');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    setError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Kérlek adj meg egy érvényes email címet');
      return;
    }
    setLoading(true);
    try {
      const updated = await usersService.updateUser(user.id, { email });
      setIsEditingEmail(false);
      setSuccess('Email sikeresen frissítve!');
      if (onUserUpdate) onUserUpdate(updated);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email frissítése sikertelen');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="page-container max-w-2xl py-12">
      {/* Header row */}
      <div className="flex items-center justify-between mb-10 flex-wrap gap-6">
        <Link to="/" className="secondary-btn-pill">
          <ArrowLeft size={16} /> Vissza
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#473472] to-[#53629E] border border-[#53629E] flex items-center justify-center shadow-xl">
            <UserIcon size={28} className="text-[#D6F4ED]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#473472] tracking-tighter uppercase">{user.username}</h1>
            <p className="text-[10px] font-black text-[#53629E] opacity-60 uppercase tracking-[0.2em] leading-none">
              {user.role === 'ADMIN' ? 'Adminisztrátor' : 'Felhasználó'}
            </p>
          </div>
        </div>

        {user.role === 'ADMIN' && (
          <Link to="/admin" className="secondary-btn-pill !bg-[#473472] !text-white !border-transparent hover:!bg-[#53629E]">
            <Shield size={16} /> Admin Panel
          </Link>
        )}
      </div>

      {/* Main card */}
      <div className="bg-[#473472] rounded-[2rem] border border-[#53629E] shadow-2xl overflow-hidden relative">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#87BAC3] via-[#D6F4ED] to-[#87BAC3]" />
        
        <div className="p-8 sm:p-10 flex flex-col gap-5">
          {/* Alerts */}
          {success && (
            <div className="px-5 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 text-sm font-bold animate-in fade-in slide-in-from-top-2">
              <Check size={18} className="inline mr-2" /> {success}
            </div>
          )}

          {error && (
            <div className="px-5 py-4 rounded-2xl bg-rose-500/10 border border-rose-400/20 text-rose-400 text-sm font-bold animate-in fade-in slide-in-from-top-top-2">
              <X size={18} className="inline mr-2" /> {error}
            </div>
          )}

          {steamMessage && (
            <div className={`px-5 py-4 rounded-2xl border text-sm font-bold animate-in fade-in slide-in-from-top-2 ${
              steamMessage.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-400/20 text-emerald-300' 
                : 'bg-rose-500/10 border-rose-400/20 text-rose-400'
            }`}>
              {steamMessage.type === 'success' ? <Check size={18} className="inline mr-2" /> : <X size={18} className="inline mr-2" />}
              {steamMessage.text}
              <button onClick={() => setSteamMessage(null)} className="float-right opacity-60 hover:opacity-100">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Info blocks using glass-card-row */}
          <div className="glass-card-row">
            <div className="w-12 h-12 rounded-xl bg-[#53629E]/30 flex items-center justify-center flex-shrink-0 border border-white/5">
              <UserIcon size={20} className="text-[#87BAC3]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="glass-label !mb-0.5">Felhasználónév</div>
              {isEditingUsername ? (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="glass-input !py-2 !px-4 !text-sm flex-1"
                    placeholder="Új felhasználónév"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleUpdateUsername} disabled={loading} className="px-4 py-2 rounded-xl bg-[#D6F4ED] text-[#473472] text-xs font-black uppercase hover:bg-[#87BAC3] transition-all disabled:opacity-50">
                      Mentés
                    </button>
                    <button onClick={() => { setUsername(user.username || ''); setIsEditingUsername(false); setError(''); }} className="px-4 py-2 rounded-xl bg-white/5 text-[#D6F4ED] text-xs font-black uppercase hover:bg-white/10 transition-all">
                      Mégse
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-lg font-black text-[#D6F4ED]">{user.username}</div>
              )}
            </div>
            {!isEditingUsername && (
              <button onClick={() => setIsEditingUsername(true)} className="p-2.5 rounded-xl bg-white/5 text-[#87BAC3] hover:text-[#D6F4ED] hover:bg-white/10 transition-all">
                <Edit2 size={18} />
              </button>
            )}
          </div>

          <div className="glass-card-row">
            <div className="w-12 h-12 rounded-xl bg-[#53629E]/30 flex items-center justify-center flex-shrink-0 border border-white/5">
              <Mail size={20} className="text-[#87BAC3]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="glass-label !mb-0.5">Email cím</div>
              {isEditingEmail ? (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input !py-2 !px-4 !text-sm flex-1"
                    placeholder="Új email cím"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleUpdateEmail} disabled={loading} className="px-4 py-2 rounded-xl bg-[#D6F4ED] text-[#473472] text-xs font-black uppercase hover:bg-[#87BAC3] transition-all disabled:opacity-50">
                      Mentés
                    </button>
                    <button onClick={() => { setEmail(user.email || ''); setIsEditingEmail(false); setError(''); }} className="px-4 py-2 rounded-xl bg-white/5 text-[#D6F4ED] text-xs font-black uppercase hover:bg-white/10 transition-all">
                      Mégse
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-lg font-black text-[#D6F4ED]">{user.email || 'Nincs megadva'}</div>
              )}
            </div>
            {!isEditingEmail && (
              <button onClick={() => setIsEditingEmail(true)} className="p-2.5 rounded-xl bg-white/5 text-[#87BAC3] hover:text-[#D6F4ED] hover:bg-white/10 transition-all">
                <Edit2 size={18} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="glass-card-row">
              <div className="w-12 h-12 rounded-xl bg-[#53629E]/30 flex items-center justify-center flex-shrink-0">
                <Shield size={20} className="text-[#87BAC3]" />
              </div>
              <div>
                <div className="glass-label !mb-0.5">Szerepkör</div>
                <div className="text-sm font-black text-[#D6F4ED] uppercase">{user.role === 'ADMIN' ? 'Admin' : 'Tag'}</div>
              </div>
            </div>
            <div className="glass-card-row">
              <div className="w-12 h-12 rounded-xl bg-[#53629E]/30 flex items-center justify-center flex-shrink-0">
                <Calendar size={20} className="text-[#87BAC3]" />
              </div>
              <div>
                <div className="glass-label !mb-0.5">Tagság kezdete</div>
                <div className="text-sm font-black text-[#D6F4ED]">{new Date(user.createdAt).toLocaleDateString('hu-HU')}</div>
              </div>
            </div>
          </div>

          {/* Steam Section */}
          <div className="mt-4 p-6 rounded-3xl bg-[#1a1228]/40 border border-[#53629E]/30">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#1b2838] flex items-center justify-center shadow-lg">
                  <FaSteam size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-black text-[#D6F4ED] uppercase tracking-wider">Steam Integráció</h3>
                  <p className="text-[11px] text-[#87BAC3] font-bold uppercase tracking-widest opacity-70">Játékok és eredmények szinkronizálása</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={user.steamId ? undefined : handleSteamConnect}
                  disabled={!!user.steamId || loading}
                  className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                    user.steamId
                      ? 'bg-[#53629E]/20 text-emerald-400 border border-emerald-400/20 cursor-default'
                      : 'bg-[#1b2838] text-white hover:bg-[#2a475e] shadow-xl'
                  }`}
                >
                  {user.steamId ? 'Csatolva ✓' : 'Fiók csatolása'}
                </button>
                {user.steamId && (
                  <button
                    onClick={handleSteamDisconnect}
                    disabled={loading}
                    className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
                    title="Leválasztás"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Logout button */}
          <div className="mt-6 pt-6 border-t border-[#53629E]/20 flex flex-col items-center gap-4">
            <button
              onClick={() => {
                localStorage.removeItem('user');
                localStorage.removeItem('authToken');
                window.location.href = '/';
              }}
              className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-red-500/10 text-red-500 font-black text-sm uppercase tracking-[0.2em] hover:bg-red-500/20 transition-all border border-red-500/20"
            >
              <LogOut size={20} /> Kijelentkezés
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
