import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { User } from '../services/api';
import { UsersService } from '../services/api';

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
      <div className="auth-container">
        <h2>Bejelentkezés szükséges</h2>
        <p>Kérlek jelentkezz be a profil megtekintéséhez.</p>
        <Link to="/login" className="btn-primary">
          Bejelentkezés
        </Link>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <Link to="/" className="back-btn">
        ← Vissza a főoldalra
      </Link>

      <div className="profile-section">
        <h1>Profil</h1>
        {success && <div className="success-message" style={{ marginBottom: '16px' }}>{success}</div>}
        <div className="profile-info">
          <div className="info-group">
            <label>Felhasználónév:</label>
            {isEditingUsername ? (
              <div className="email-edit-form">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Felhasználónév"
                  minLength={3}
                  maxLength={32}
                />
                <button
                  className="btn-small btn-save"
                  onClick={async () => {
                    setError('');
                    if (!username.trim() || username.length < 3 || username.length > 32) {
                      setError('A felhasználónév 3-32 karakter közötti kell legyen');
                      return;
                    }
                    setLoading(true);
                    try {
                      const updated = await usersService.updateUser(user!.id, { username });
                      setIsEditingUsername(false);
                      setSuccess('Felhasználónév sikeresen frissítve!');
                      if (onUserUpdate) {
                        onUserUpdate(updated);
                      }
                      setTimeout(() => setSuccess(''), 3000);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Felhasználónév frissítése sikertelen');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  Mentés
                </button>
                <button
                  className="btn-small btn-cancel"
                  style={{ color: '#fff', background: '#e74c3c', border: 'none' }}
                  onClick={() => {
                    setUsername(user!.username || '');
                    setIsEditingUsername(false);
                    setError('');
                  }}
                  disabled={loading}
                >
                  Mégsem
                </button>
              </div>
            ) : (
              <p>
                {user.username}
                <button
                  className="btn-small btn-edit"
                  onClick={() => setIsEditingUsername(true)}
                  style={{ marginLeft: '10px' }}
                >
                  Szerkesztés
                </button>
              </p>
            )}
            {error && isEditingUsername && <div className="error-message" style={{ marginTop: '8px', fontSize: '12px' }}>{error}</div>}
          </div>
          <div className="info-group">
            <label>Email cím:</label>
            {isEditingEmail ? (
              <div className="email-edit-form">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email cím"
                />
                <button
                  className="btn-small btn-save"
                  onClick={async () => {
                    setError('');
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(email)) {
                      setError('Kérlek adj meg egy érvényes email címet');
                      return;
                    }
                    setLoading(true);
                    try {
                      const updated = await usersService.updateUser(user!.id, { email });
                      setIsEditingEmail(false);
                      setSuccess('Email sikeresen frissítve!');
                      if (onUserUpdate) {
                        onUserUpdate(updated);
                      }
                      setTimeout(() => setSuccess(''), 3000);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Email frissítése sikertelen');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  Mentés
                </button>
                <button
                  className="btn-small btn-cancel"
                  style={{ color: '#fff', background: '#e74c3c', border: 'none' }}
                  onClick={() => {
                    setEmail(user!.email || '');
                    setIsEditingEmail(false);
                    setError('');
                  }}
                  disabled={loading}
                >
                  Mégsem
                </button>
              </div>
            ) : (
              <p>
                {user.email || 'Nincs megadva'}
                <button
                  className="btn-small btn-edit"
                  onClick={() => setIsEditingEmail(true)}
                  style={{ marginLeft: '10px' }}
                >
                   Szerkesztés
                </button>
              </p>
            )}
            {error && <div className="error-message" style={{ marginTop: '8px', fontSize: '12px' }}>{error}</div>}
          </div>
          <div className="info-group">
            <label>Szerepkör:</label>
            <p>
              {user.role === 'ADMIN' ? ' Administrator' : 'Felhasználó'}
            </p>
          </div>
          <div className="info-group">
            <label>Létrehozva:</label>
            <p>{new Date(user.createdAt).toLocaleDateString('hu-HU')}</p>
          </div>
          <div className="info-group">
            <label>Utolsó frissítés:</label>
            <p>{new Date(user.updatedAt).toLocaleDateString('hu-HU')}</p>
          </div>
        </div>

        {user.role === 'ADMIN' && (
          <div className="admin-link">
            <Link to="/admin" className="btn-primary">
              Felhasználók kezelése
            </Link>
          </div>
        )}

        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-logout" style={{ color: '#fff', background: '#e74c3c', border: 'none' }} onClick={() => {
            localStorage.removeItem('user');
            localStorage.removeItem('authToken');
            window.location.href = '/';
          }}>
            Kijelentkezés
          </button>
        </div>
      </div>
    </div>
  );
}
