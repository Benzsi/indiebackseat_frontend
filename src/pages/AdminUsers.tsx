import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UsersService } from '../services/api';
import type { User } from '../services/api';
import { ArrowLeft, User as UserIcon, Edit2, Trash2, Check, X, Shield, RefreshCw, UserPlus, UserCog, Code } from 'lucide-react';

interface AdminProps {
  user: User | null;
}

export function AdminUsers({ user }: AdminProps) {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'USER' | 'ADMIN' | 'DEVELOPER'>('USER');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createUsername, setCreateUsername] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<'USER' | 'ADMIN' | 'DEVELOPER'>('USER');

  const usersService = new UsersService();

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await usersService.getAllUsers();
      setUsers(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Felhasználók lekérése sikertelen');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Biztosan törlöd ezt a felhasználót?')) return;
    try {
      await usersService.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
      setSuccess('Felhasználó sikeresen törölve!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Felhasználó törlése sikertelen');
    }
  };

  const handleUpdateUser = async (id: number) => {
    if (!newUsername.trim()) { setError('A felhasználónév nem lehet üres'); return; }
    try {
      const updated = await usersService.updateUser(id, { username: newUsername, email: newEmail, role: newRole });
      setUsers(users.map(u => u.id === id ? updated : u));
      setEditingId(null);
      setNewUsername('');
      setSuccess('Felhasználó sikeresen frissítve!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Felhasználó frissítése sikertelen');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!createUsername.trim() || !createPassword.trim()) { setError('Kérlek töltsd ki az összes mezőt'); return; }
    if (createUsername.length < 3 || createUsername.length > 32) { setError('A felhasználónév 3-32 karakter közötti kell legyen'); return; }
    if (createPassword.length < 4 || createPassword.length > 64) { setError('A jelszó 4-64 karakter közötti kell legyen'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createEmail)) { setError('Kérlek adj meg egy érvényes email címet'); return; }
    try {
      const newUser = await usersService.createUser({ username: createUsername, email: createEmail, password: createPassword, role: createRole });
      setUsers([...users, newUser]);
      setCreateUsername(''); setCreateEmail(''); setCreatePassword(''); setCreateRole('USER');
      setShowCreateForm(false);
      setSuccess('Felhasználó sikeresen létrehozva!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Felhasználó létrehozása sikertelen');
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '2rem', textAlign: 'center' }} className="panel-card">
        <h2 style={{ color: 'var(--color-primary)', marginBottom: '16px' }}>Hozzáférés megtagadva</h2>
        <p style={{ color: 'var(--color-secondary)', marginBottom: '24px' }}>Ez az oldal csak adminisztrátorok számára elérhető.</p>
        <Link to="/" className="nav-pill nav-pill-primary">Vissza a főoldalra</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem' }}>

      {/* Fejléc: Vissza gombok és Főcím reszponzív Griddel */}
      <div className="page-header-grid">
        <Link to="/" className="nav-pill nav-pill-light">
          <ArrowLeft size={18} /> Vissza a főoldalra
        </Link>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '24px' }} className="flex-gap-12 fw-800" >
            <UserIcon size={28} /> Felhasználók kezelése
          </h1>
        </div>
        <Link to="/profile" className="nav-pill nav-pill-primary">
          <UserCog size={18} /> Profilom
        </Link>
      </div>

      <div className="panel-card">

        {/* Felső vezérlő sáv */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }} className="flex-between" >
          <div className="flex-gap-12">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="nav-pill"
              style={{ background: showCreateForm ? '#fee2e2' : 'var(--color-accent)', color: showCreateForm ? '#ef4444' : '#fff', border: 'none' }}
            >
              {showCreateForm ? <><X size={18} /> Elrejtés</> : <><UserPlus size={18} /> Új felhasználó</>}
            </button>
            <button
              onClick={fetchUsers} disabled={loading}
              className="nav-pill"
              style={{ background: '#fff', color: '#475569', border: '1px solid #cbd5e1', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              <RefreshCw size={18} /> {loading ? 'Betöltés...' : 'Frissítés'}
            </button>
          </div>
        </div>

        <div style={{ padding: '2rem' }}>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* Új felhasználó űrlap */}
          {showCreateForm && (
            <div style={{ background: '#f1f5f9', padding: '24px', borderRadius: '12px', marginBottom: '32px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ marginTop: 0, fontSize: '18px', color: 'var(--color-primary)', marginBottom: '20px' }}>Létrehozás</h2>
              <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
                <div className="form-field">
                  <label>Felhasználónév</label>
                  <input type="text" value={createUsername} onChange={(e) => setCreateUsername(e.target.value)} placeholder="..." />
                </div>
                <div className="form-field">
                  <label>Email cím</label>
                  <input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder="pelda@email.com" />
                </div>
                <div className="form-field">
                  <label>Jelszó</label>
                  <input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} placeholder="..." />
                </div>
                <div className="form-field">
                  <label>Szerepkör</label>
                  <select value={createRole} onChange={(e) => setCreateRole(e.target.value as 'USER' | 'ADMIN' | 'DEVELOPER')}>
                    <option value="USER">Felhasználó</option>
                    <option value="ADMIN">Adminisztrátor</option>
                    <option value="DEVELOPER">Fejlesztő</option>
                  </select>
                </div>
                <button type="submit" className="nav-pill nav-pill-primary" style={{ height: '42px' }}>Hozzáadás</button>
              </form>
            </div>
          )}

          {/* Táblázat */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: 'var(--color-primary)', color: '#fff', textAlign: 'left' }}>
                  <th style={{ padding: '14px 16px', borderRadius: '8px 0 0 8px', width: '60px' }}>ID</th>
                  <th style={{ padding: '14px 16px' }}>Név / Email</th>
                  <th style={{ padding: '14px 16px' }}>Szerepkör</th>
                  <th style={{ padding: '14px 16px' }}>Regisztrált</th>
                  <th style={{ padding: '14px 16px', borderRadius: '0 8px 8px 0', textAlign: 'right' }}>Műveletek</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s', background: editingId === u.id ? '#f8fafc' : 'transparent' }}
                    onMouseEnter={e => { if (editingId !== u.id) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={e => { if (editingId !== u.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '16px', fontWeight: 600, color: '#94a3b8' }}>#{u.id}</td>

                    <td style={{ padding: '16px' }}>
                      {editingId === u.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <input className="form-field input" type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="Felhasználónév" />
                          <input className="form-field input" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="Email" />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="fw-700" style={{ color: 'var(--color-primary)', fontSize: '15px' }}>{u.username}</span>
                          <span className="text-muted text-small">{u.email || '-'}</span>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '16px' }}>
                      {editingId === u.id ? (
                        <select value={newRole} onChange={(e) => setNewRole(e.target.value as 'USER' | 'ADMIN' | 'DEVELOPER')} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}>
                          <option value="USER">Felhasználó</option>
                          <option value="ADMIN">Admin</option>
                          <option value="DEVELOPER">Fejlesztő</option>
                        </select>
                      ) : (
                        <span className={`role-badge ${u.role === 'ADMIN' ? 'role-badge-admin' : u.role === 'DEVELOPER' ? 'role-badge-admin' : 'role-badge-user'}`}>
                          {u.role === 'ADMIN' ? <Shield size={14} /> : u.role === 'DEVELOPER' ? <Code size={14} /> : <UserIcon size={14} />}
                          {u.role === 'ADMIN' ? 'Adminisztrátor' : u.role === 'DEVELOPER' ? 'Fejlesztő' : 'Felhasználó'}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '16px' }} className="text-muted text-small">
                      {new Date(u.createdAt).toLocaleDateString('hu-HU')}
                    </td>

                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      {editingId === u.id ? (
                        <div className="flex-gap-8" style={{ justifyContent: 'flex-end' }}>
                          <button onClick={() => handleUpdateUser(u.id)} title="Mentés" className="icon-btn icon-btn-save"><Check size={16} /></button>
                          <button onClick={() => setEditingId(null)} title="Mégsem" className="icon-btn icon-btn-cancel"><X size={16} /></button>
                        </div>
                      ) : (
                        <div className="flex-gap-8" style={{ justifyContent: 'flex-end' }}>
                          <button onClick={() => { setEditingId(u.id); setNewUsername(u.username); setNewEmail(u.email || ''); setNewRole(u.role); }} title="Szerkesztés" className="icon-btn icon-btn-edit"><Edit2 size={16} /></button>
                          <button onClick={() => handleDeleteUser(u.id)} title="Törlés" className="icon-btn icon-btn-delete"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && !loading && (
            <div style={{ padding: '40px', textAlign: 'center' }} className="text-muted">
              Nincs megjeleníthető felhasználó.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
