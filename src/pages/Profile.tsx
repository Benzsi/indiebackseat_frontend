import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { User } from '../services/api';
import { UsersService } from '../services/api';
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
  const usersService = new UsersService();

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
