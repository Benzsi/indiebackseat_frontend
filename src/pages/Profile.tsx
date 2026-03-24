import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { User } from '../services/api';
import { UsersService, AuthService } from '../services/api';
import { User as UserIcon, Mail, Shield, Calendar, Edit2, ArrowLeft, LogOut, Check, X } from 'lucide-react';

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
    // Visszatérés a Steamről URL paraméterek ellenőrzésével
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

  const handleSteamConnect = () => {
    const token = localStorage.getItem('authToken'); 
    if (!token) {
      alert('Nem vagy bejelentkezve!');
      return;
    }
    const backendUrl = `http://localhost:3000/api/auth/steam?token=${token}`;
    window.location.href = backendUrl;
  };

  const handleSteamDisconnect = async () => {
    if (!window.confirm('Biztosan le szeretnéd választani a Steam fiókodat?')) return;
    setLoading(true);
    try {
      const { user: updatedUser } = await authService.unlinkSteam();
      setSteamMessage({ text: 'A Steam fiókod sikeresen le lett választva!', type: 'success' });
      if (onUserUpdate) onUserUpdate(updatedUser);
    } catch (err) {
      setSteamMessage({ text: err instanceof Error ? err.message : 'Hiba történt a Steam fiók leválasztása során.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="panel-card" style={{ maxWidth: '600px', margin: '4rem auto', padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-primary)', marginBottom: '16px' }}>Bejelentkezés szükséges</h2>
        <p style={{ color: 'var(--color-secondary)', marginBottom: '24px' }}>Kérlek jelentkezz be a profil megtekintéséhez.</p>
        <Link to="/login" className="nav-pill nav-pill-primary">Bejelentkezés</Link>
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
    <div style={{ maxWidth: '750px', margin: '2rem auto', padding: '0 1rem' }}>

      {/* Fejléc 3-oszlopos grid */}
      <div className="page-header-grid">
        <Link to="/" className="nav-pill nav-pill-light">
          <ArrowLeft size={18} /> Vissza a főoldalra
        </Link>

        {/* Kis méretű profil megjelenítés középen */}
        <div className="flex-center flex-gap-16">
          <div className="avatar-circle">
            <UserIcon size={30} color="#fff" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)' }}>{user.username}</h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }} className="fw-700">
              {user.role === 'ADMIN' ? 'Adminisztrátor' : 'Felhasználó'}
            </p>
          </div>
        </div>

        {/* Jobb oldal – csak adminnak */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {user.role === 'ADMIN' && (
            <Link to="/admin" className="nav-pill nav-pill-primary" style={{ background: 'var(--color-accent)' }}>
              <Shield size={18} /> Felhasználók kezelése
            </Link>
          )}
        </div>
      </div>

      <div className="panel-card">
        <div style={{ padding: '2.5rem' }}>
          {success && <div className="alert alert-success">{success}</div>}
          {steamMessage && (
            <div className={`alert ${steamMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
              {steamMessage.text}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Felhasználónév mező */}
            <div className="info-row" style={{ minHeight: '120px' }}>
              <UserIcon size={22} className="info-row-icon" />
              <div className="info-row-body">
                <div className="info-row-label">Felhasználónév</div>
                {isEditingUsername ? (
                  <div className="flex-gap-8" style={{ marginTop: '8px' }}>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="edit-input"
                      placeholder="Új felhasználónév"
                    />
                    <button onClick={handleUpdateUsername} disabled={loading} className="edit-save-btn">
                      <Check size={16} /> Mentés
                    </button>
                    <button onClick={() => { setUsername(user.username || ''); setIsEditingUsername(false); setError(''); }} disabled={loading} className="edit-cancel-btn">
                      <X size={16} /> Mégsem
                    </button>
                  </div>
                ) : (
                  <div className="info-row-value" style={{ marginTop: '8px' }}>{user.username}</div>
                )}
                {error && isEditingUsername && <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', fontWeight: 500 }}>{error}</div>}
              </div>
              {!isEditingUsername && (
                <button onClick={() => setIsEditingUsername(true)} title="Szerkesztés" className="edit-icon-btn">
                  <Edit2 size={18} />
                </button>
              )}
            </div>

            {/* Email mező */}
            <div className="info-row" style={{ minHeight: '120px' }}>
              <Mail size={22} className="info-row-icon" />
              <div className="info-row-body">
                <div className="info-row-label">Email cím</div>
                {isEditingEmail ? (
                  <div className="flex-gap-8" style={{ marginTop: '8px' }}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="edit-input"
                      placeholder="Új email cím"
                    />
                    <button onClick={handleUpdateEmail} disabled={loading} className="edit-save-btn">
                      <Check size={16} /> Mentés
                    </button>
                    <button onClick={() => { setEmail(user.email || ''); setIsEditingEmail(false); setError(''); }} disabled={loading} className="edit-cancel-btn">
                      <X size={16} /> Mégsem
                    </button>
                  </div>
                ) : (
                  <div className="info-row-value" style={{ marginTop: '8px' }}>{user.email || 'Nincs megadva'}</div>
                )}
                {error && isEditingEmail && <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', fontWeight: 500 }}>{error}</div>}
              </div>
              {!isEditingEmail && (
                <button onClick={() => setIsEditingEmail(true)} title="Szerkesztés" className="edit-icon-btn">
                  <Edit2 size={18} />
                </button>
              )}
            </div>

            {/* Szerepkör */}
            <div className="info-row">
              <Shield size={22} className="info-row-icon" />
              <div className="info-row-body">
                <div className="info-row-label">Szerepkör</div>
                <div className="info-row-value">{user.role === 'ADMIN' ? 'Adminisztrátor' : 'Felhasználó'}</div>
              </div>
            </div>

            {/* Csatlakozás dátuma */}
            <div className="info-row">
              <Calendar size={22} className="info-row-icon" />
              <div className="info-row-body">
                <div className="info-row-label">Csatlakozás dátuma</div>
                <div className="info-row-value">{new Date(user.createdAt).toLocaleDateString('hu-HU')}</div>
              </div>
            </div>

          </div>

          {/* Steam Integráció sáv */}
          <div style={{ marginTop: '2rem', padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', transition: 'box-shadow 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Steam Integráció
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Csatold a Steam fiókodat, hogy szinkronizálni tudjuk az adataidat és játékokat importáljunk!
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={user.steamId ? undefined : handleSteamConnect}
                  disabled={!!user.steamId}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    background: user.steamId ? '#475569' : '#171a21', color: '#fff', padding: '12px 24px',
                    borderRadius: '8px', border: 'none', fontWeight: 700,
                    cursor: user.steamId ? 'default' : 'pointer', whiteSpace: 'nowrap', transition: 'background 0.2s',
                    boxShadow: user.steamId ? 'none' : '0 4px 12px rgba(23, 26, 33, 0.2)',
                    opacity: user.steamId ? 0.9 : 1
                  }}
                  onMouseEnter={(e) => { if (!user.steamId) e.currentTarget.style.background = '#2a475e'; }}
                  onMouseLeave={(e) => { if (!user.steamId) e.currentTarget.style.background = '#171a21'; }}
                >
                  {user.steamId ? (
                    <Check size={22} />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.979 0C5.353 0 0 5.372 0 12.001c0 2.585.8 4.981 2.164 6.953l6.231-3.642v-.385c0-1.704 1.385-3.086 3.088-3.086 1.702 0 3.088 1.382 3.088 3.086 0 1.702-1.386 3.086-3.088 3.086-.711 0-1.365-.246-1.889-.652L3.109 21.05h.005C5.467 23.23 8.572 24 11.979 24 18.604 24 24 18.627 24 12.001 24 5.372 18.604 0 11.979 0zm-6.19 14.86c0 .852.69 1.542 1.543 1.542.85 0 1.541-.69 1.541-1.542 0-.852-.69-1.542-1.541-1.542-.853 0-1.543.69-1.543 1.542zm6.23-2.023c-1.134 0-2.05.918-2.05 2.054 0 1.137.916 2.055 2.05 2.055 1.134 0 2.049-.918 2.049-2.055 0-1.136-.915-2.054-2.049-2.054zm0 3.23a1.176 1.176 0 110-2.353 1.176 1.176 0 010 2.353z" />
                    </svg>
                  )}
                  {user.steamId ? 'Steam fiók csatolva' : 'Steam fiók csatolása'}
                </button>
                {user.steamId && (
                  <button
                    onClick={handleSteamDisconnect}
                    disabled={loading}
                    className="btn-logout-danger"
                    style={{ padding: '12px 24px', whiteSpace: 'nowrap' }}
                  >
                    Leválasztás
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Kijelentkezés */}
          <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', alignItems: 'center', borderTop: '2px dashed #e2e8f0', paddingTop: '2.5rem' }}>
            <button
              className="btn-logout-danger"
              onClick={() => {
                localStorage.removeItem('user');
                localStorage.removeItem('authToken');
                window.location.href = '/';
              }}
            >
              <LogOut size={18} /> Kijelentkezés
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
