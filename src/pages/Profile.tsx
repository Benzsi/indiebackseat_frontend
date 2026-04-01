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

  const inputClass = "flex-1 bg-[#53629E]/40 border border-[#53629E] text-[#D6F4ED] placeholder-[#87BAC3]/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#87BAC3] transition-all";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header row */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-[#D6F4ED] border border-[#53629E] bg-[#53629E]/30 hover:bg-[#53629E]/60 transition-all"
        >
          <ArrowLeft size={16} /> Vissza
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#473472] to-[#53629E] border border-[#53629E] flex items-center justify-center shadow-lg">
            <UserIcon size={24} className="text-[#D6F4ED]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#473472]">{user.username}</h1>
            <p className="text-xs font-black text-[#53629E] opacity-70 uppercase tracking-widest leading-none">
              {user.role === 'ADMIN' ? 'Adminisztrátor' : 'Felhasználó'}
            </p>
          </div>
        </div>

        {user.role === 'ADMIN' && (
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-[#D6F4ED] bg-[#473472] hover:bg-[#53629E] transition-all"
          >
            <Shield size={16} /> Felhasználók kezelése
          </Link>
        )}
      </div>

      {/* Main card */}
      <div className="bg-[#473472] rounded-3xl border border-[#53629E] shadow-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-[#87BAC3] to-[#D6F4ED]" />
        <div className="p-6 sm:p-8 flex flex-col gap-4">

          {/* Alerts */}
          {success && (
            <div className="px-4 py-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-sm font-semibold">
              {success}
            </div>
          )}


          {/* Info rows */}
          {/* Username */}
          <div className="bg-[#53629E]/20 border border-[#53629E]/40 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#53629E]/40 flex items-center justify-center flex-shrink-0">
              <UserIcon size={18} className="text-[#87BAC3]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-[#87BAC3] uppercase tracking-widest mb-1">Felhasználónév</div>
              {isEditingUsername ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={inputClass}
                    placeholder="Új felhasználónév"
                  />
                  <button onClick={handleUpdateUsername} disabled={loading} className="px-3 py-2 rounded-lg bg-[#D6F4ED] text-[#473472] text-sm font-bold hover:bg-[#87BAC3] transition-all disabled:opacity-60 flex items-center gap-1">
                    <Check size={14} /> Mentés
                  </button>
                  <button onClick={() => { setUsername(user.username || ''); setIsEditingUsername(false); setError(''); }} disabled={loading} className="px-3 py-2 rounded-lg bg-[#53629E]/40 text-[#D6F4ED] text-sm font-semibold hover:bg-[#53629E]/60 transition-all flex items-center gap-1">
                    <X size={14} /> Mégsem
                  </button>
                </div>
              ) : (
                <div className="text-base font-bold text-[#D6F4ED]">{user.username}</div>
              )}
              {error && isEditingUsername && <div className="text-red-400 text-xs mt-1 font-semibold">{error}</div>}
            </div>
            {!isEditingUsername && (
              <button onClick={() => setIsEditingUsername(true)} className="p-2 rounded-lg bg-[#53629E]/40 text-[#87BAC3] hover:text-[#D6F4ED] hover:bg-[#53629E]/60 transition-all flex-shrink-0">
                <Edit2 size={16} />
              </button>
            )}
          </div>

          {/* Email */}
          <div className="bg-[#53629E]/20 border border-[#53629E]/40 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#53629E]/40 flex items-center justify-center flex-shrink-0">
              <Mail size={18} className="text-[#87BAC3]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-[#87BAC3] uppercase tracking-widest mb-1">Email cím</div>
              {isEditingEmail ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="Új email cím"
                  />
                  <button onClick={handleUpdateEmail} disabled={loading} className="px-3 py-2 rounded-lg bg-[#D6F4ED] text-[#473472] text-sm font-bold hover:bg-[#87BAC3] transition-all disabled:opacity-60 flex items-center gap-1">
                    <Check size={14} /> Mentés
                  </button>
                  <button onClick={() => { setEmail(user.email || ''); setIsEditingEmail(false); setError(''); }} disabled={loading} className="px-3 py-2 rounded-lg bg-[#53629E]/40 text-[#D6F4ED] text-sm font-semibold hover:bg-[#53629E]/60 transition-all flex items-center gap-1">
                    <X size={14} /> Mégsem
                  </button>
                </div>
              ) : (
                <div className="text-base font-bold text-[#D6F4ED]">{user.email || 'Nincs megadva'}</div>
              )}
              {error && isEditingEmail && <div className="text-red-400 text-xs mt-1 font-semibold">{error}</div>}
            </div>
            {!isEditingEmail && (
              <button onClick={() => setIsEditingEmail(true)} className="p-2 rounded-lg bg-[#53629E]/40 text-[#87BAC3] hover:text-[#D6F4ED] hover:bg-[#53629E]/60 transition-all flex-shrink-0">
                <Edit2 size={16} />
              </button>
            )}
          </div>

          {/* Role */}
          <div className="bg-[#53629E]/20 border border-[#53629E]/40 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#53629E]/40 flex items-center justify-center flex-shrink-0">
              <Shield size={18} className="text-[#87BAC3]" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-[#87BAC3] uppercase tracking-widest mb-1">Szerepkör</div>
              <div className="text-base font-bold text-[#D6F4ED]">{user.role === 'ADMIN' ? 'Adminisztrátor' : 'Felhasználó'}</div>
            </div>
          </div>

          {/* Date */}
          <div className="bg-[#53629E]/20 border border-[#53629E]/40 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#53629E]/40 flex items-center justify-center flex-shrink-0">
              <Calendar size={18} className="text-[#87BAC3]" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-[#87BAC3] uppercase tracking-widest mb-1">Csatlakozás dátuma</div>
              <div className="text-base font-bold text-[#D6F4ED]">{new Date(user.createdAt).toLocaleDateString('hu-HU')}</div>
            </div>
          </div>

          {/* Steam Integration */}
          <div className="bg-[#53629E]/10 border border-[#53629E]/40 rounded-2xl p-5 mt-2">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-lg font-black text-[#D6F4ED] flex items-center gap-2">
                  <FaSteam className="text-[#87BAC3]" /> Steam Integráció
                </h3>
                <p className="text-[#87BAC3] text-sm mt-1">
                  Csatold a Steam fiókodat, hogy szinkronizálni tudjuk az adataidat!
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={user.steamId ? undefined : handleSteamConnect}
                  disabled={!!user.steamId}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    user.steamId
                      ? 'bg-[#53629E]/40 text-[#87BAC3] cursor-default'
                      : 'bg-[#1b2838] text-white hover:bg-[#2a475e] shadow-lg'
                  }`}
                >
                  <FaSteam size={18} />
                  {user.steamId ? 'Steam fiók csatolva ✓' : 'Steam fiók csatolása'}
                </button>
                {user.steamId && (
                  <button
                    onClick={handleSteamDisconnect}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-red-500/20 text-red-400 border border-red-400/40 hover:bg-red-500/30 transition-all disabled:opacity-60"
                  >
                    Leválasztás
                  </button>
                )}
              </div>
            </div>
            {steamMessage && (
              <div className={`mt-4 px-4 py-3 rounded-xl text-sm font-semibold border ${
                steamMessage.type === 'success'
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                  : 'bg-red-500/20 border-red-400/40 text-red-300'
              }`}>
                {steamMessage.text.includes('https://steamcommunity.com/dev/apikey') ? (
                  <>
                    Nincs megadva Steam API kulcs! Regisztrálj egyet itt:{' '}
                    <a 
                      href="https://steamcommunity.com/dev/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline text-red-100 font-bold ml-1"
                    >
                      https://steamcommunity.com/dev/apikey
                    </a>
                  </>
                ) : (
                  steamMessage.text
                )}
              </div>
            )}
          </div>

          {/* Logout */}
          <div className="pt-4 border-t border-[#53629E]/30 flex justify-center">
            <button
              onClick={() => {
                localStorage.removeItem('user');
                localStorage.removeItem('authToken');
                window.location.href = '/';
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/20 text-red-400 border border-red-400/30 font-bold text-sm hover:bg-red-500/30 transition-all"
            >
              <LogOut size={18} /> Kijelentkezés
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
