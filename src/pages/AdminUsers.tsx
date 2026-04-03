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
    if (user?.role !== 'ADMIN') { navigate('/'); return; }
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
    if (createUsername.length < 3 || createUsername.length > 32) { setError('A felhasználónév 3-32 karakter'); return; }
    if (createPassword.length < 4 || createPassword.length > 64) { setError('A jelszó 4-64 karakter'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createEmail)) { setError('Érvénytelen email cím'); return; }
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

  const roleBadge = (role: string) => {
    if (role === 'ADMIN') return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D6F4ED]/20 text-[#D6F4ED] border border-[#D6F4ED]/30">
        <Shield size={11} /> Adminisztrátor
      </span>
    );
    if (role === 'DEVELOPER') return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-300/20 text-amber-300 border border-amber-300/30">
        <Code size={11} /> Fejlesztő
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#87BAC3]/20 text-[#87BAC3] border border-[#87BAC3]/30">
        <UserIcon size={11} /> Felhasználó
      </span>
    );
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-[#473472] rounded-3xl border border-[#53629E] shadow-2xl p-10 text-center max-w-sm w-full">
          <Shield size={48} className="text-[#87BAC3] mx-auto mb-4" />
          <h2 className="text-2xl font-black text-[#D6F4ED] mb-2">Hozzáférés megtagadva</h2>
          <p className="text-[#87BAC3] mb-6 text-sm">Ez az oldal csak adminisztrátorok számára érhető el.</p>
          <Link to="/" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#D6F4ED] text-[#473472] font-black text-sm hover:bg-[#87BAC3] transition-all">
            Vissza a főoldalra
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-5xl py-12">
      {/* Header row */}
      <div className="flex items-center justify-between mb-10 flex-wrap gap-6">
        <Link to="/" className="secondary-btn-pill">
          <ArrowLeft size={16} /> Vissza
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#473472] to-[#53629E] flex items-center justify-center shadow-xl">
            <UserIcon size={24} className="text-[#D6F4ED]" />
          </div>
          <h1 className="text-2xl font-black text-[#473472] tracking-tighter uppercase">
            Felhasználók <span className="text-[#53629E]/60">kezelése</span>
          </h1>
        </div>

        <Link to="/profile" className="secondary-btn-pill !bg-[#473472] !text-white !border-transparent hover:!bg-[#53629E]">
          <UserCog size={16} /> Profilom
        </Link>
      </div>

      {/* Main card */}
      <div className="bg-[#473472] rounded-[2rem] border border-[#53629E] shadow-2xl overflow-hidden relative">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#87BAC3] to-[#D6F4ED]" />

        {/* Control bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap px-8 py-6 border-b border-[#53629E]/30 bg-[#1a1228]/20">
          <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                showCreateForm
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                  : 'bg-[#D6F4ED] text-[#473472] hover:bg-[#87BAC3] shadow-lg shadow-[#D6F4ED]/10'
              }`}
            >
              {showCreateForm ? <><X size={16} strokeWidth={3} /> Mégse</> : <><UserPlus size={16} strokeWidth={3} /> Új felhasználó</>}
            </button>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-[#87BAC3] border border-[#53629E]/40 hover:bg-white/5 transition-all disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Frissítés</span>
            </button>
          </div>
          <div className="px-4 py-1.5 rounded-full bg-[#D6F4ED]/5 border border-[#D6F4ED]/10 text-[#D6F4ED] text-[10px] font-black uppercase tracking-widest">
            {users.length} Felhasználó
          </div>
        </div>

        <div className="p-6 md:p-10">
          {/* Alerts */}
          {error && (
            <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm fade-in">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-8 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm fade-in">
              <Check size={18} className="inline mr-2" /> {success}
            </div>
          )}

          {/* Create form */}
          {showCreateForm && (
            <div className="mb-10 bg-[#1a1228]/30 border border-[#53629E]/40 rounded-3xl p-8 animate-in zoom-in-95 duration-300">
              <h2 className="text-xl font-black text-[#D6F4ED] mb-8 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-[#D6F4ED] text-[#473472]">
                  <UserPlus size={22} strokeWidth={3} />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-[#87BAC3] mb-1">Rendszer</div>
                  <span>Felhasználó regisztrálása</span>
                </div>
              </h2>
              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="glass-label">Felhasználónév</label>
                  <input type="text" value={createUsername} onChange={(e) => setCreateUsername(e.target.value)} placeholder="Pl. AdminElek" className="glass-input" />
                </div>
                <div>
                  <label className="glass-label">Email cím</label>
                  <input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder="pelda@email.com" className="glass-input" />
                </div>
                <div>
                  <label className="glass-label">Jelszó</label>
                  <input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} placeholder="••••••••" className="glass-input" />
                </div>
                <div>
                  <label className="glass-label">Szerepkör</label>
                  <select value={createRole} onChange={(e) => setCreateRole(e.target.value as any)} className="glass-input cursor-pointer appearance-none bg-[#1a1228]">
                    <option value="USER">Felhasználó</option>
                    <option value="ADMIN">Adminisztrátor</option>
                    <option value="DEVELOPER">Fejlesztő</option>
                  </select>
                </div>
                <button type="submit" className="md:col-span-full py-4 rounded-xl bg-[#D6F4ED] text-[#473472] font-black uppercase tracking-widest text-sm hover:bg-[#87BAC3] transition-all shadow-xl shadow-[#D6F4ED]/10 mt-2">
                  Regisztráció végrehajtása
                </button>
              </form>
            </div>
          )}

          {/* User List */}
          <div className="space-y-4">
            {/* Desktop Header */}
            <div className="hidden md:grid grid-cols-[80px_1fr_180px_140px_120px] gap-4 px-8 py-4 bg-[#1a1228]/30 rounded-2xl mb-4 border border-white/5">
              <span className="text-[10px] font-black text-[#87BAC3]/60 uppercase tracking-[0.2em]">ID</span>
              <span className="text-[10px] font-black text-[#87BAC3]/60 uppercase tracking-[0.2em]">Felhasználói adatok</span>
              <span className="text-[10px] font-black text-[#87BAC3]/60 uppercase tracking-[0.2em]">Szerepkör</span>
              <span className="text-[10px] font-black text-[#87BAC3]/60 uppercase tracking-[0.2em]">Csatlakozva</span>
              <span className="text-[10px] font-black text-[#87BAC3]/60 uppercase tracking-[0.2em] text-right">Műveletek</span>
            </div>

            {loading ? (
              <div className="py-24 text-center">
                <RefreshCw size={40} className="text-[#87BAC3] mx-auto animate-spin mb-4 opacity-20" />
                <div className="text-[#87BAC3] font-black uppercase tracking-[0.3em] text-xs">Adatok lekérése...</div>
              </div>
            ) : users.length === 0 ? (
              <div className="py-20 text-center text-[#87BAC3] italic font-medium opacity-50">Nincs megjeleníthető felhasználó.</div>
            ) : (
              users.map((u) => (
                <div 
                  key={u.id}
                  className={`relative flex flex-col md:grid md:grid-cols-[80px_1fr_180px_140px_120px] md:items-center gap-4 p-6 md:px-8 md:py-5 bg-[#53629E]/5 border border-[#53629E]/10 rounded-2xl hover:bg-[#53629E]/15 transition-all ${editingId === u.id ? 'ring-2 ring-[#87BAC3] bg-[#53629E]/20' : ''}`}
                >
                  {/* ID */}
                  <div className="text-sm font-black text-[#87BAC3]/40">
                    <span className="md:hidden text-[10px] uppercase font-bold mr-2 text-[#87BAC3]/30">ID:</span>
                    #{u.id}
                  </div>

                  {/* Info */}
                  <div className="flex flex-col min-w-0">
                    {editingId === u.id ? (
                      <div className="flex flex-col gap-3 w-full pr-4">
                        <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Név" className="glass-input !py-2" />
                        <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email" className="glass-input !py-2" />
                      </div>
                    ) : (
                      <>
                        <span className="text-lg font-black text-[#D6F4ED] truncate uppercase tracking-tighter">{u.username}</span>
                        <span className="text-xs text-[#87BAC3] truncate font-bold uppercase tracking-widest opacity-60">{u.email || 'Nincs email'}</span>
                      </>
                    )}
                  </div>

                  {/* Role */}
                  <div className="flex items-center">
                    {editingId === u.id ? (
                      <select value={newRole} onChange={(e) => setNewRole(e.target.value as any)} className="glass-input !py-2 cursor-pointer bg-[#1a1228] appearance-none">
                        <option value="USER">Tag</option>
                        <option value="ADMIN">Admin</option>
                        <option value="DEVELOPER">Fejlesztő</option>
                      </select>
                    ) : roleBadge(u.role)}
                  </div>

                  {/* Date */}
                  <div className="text-xs font-bold text-[#D6F4ED]/60">
                    <span className="md:hidden uppercase text-[9px] mr-2 block mb-1 opacity-40">Regisztráció:</span>
                    {new Date(u.createdAt).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 justify-end pt-5 md:pt-0 border-t md:border-none border-white/5">
                    {editingId === u.id ? (
                      <>
                        <button onClick={() => handleUpdateUser(u.id)} className="flex-1 md:flex-none p-3.5 rounded-xl bg-[#D6F4ED] text-[#473472] hover:bg-[#87BAC3] transition-all flex justify-center shadow-lg shadow-[#D6F4ED]/5">
                          <Check size={20} strokeWidth={3} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="flex-1 md:flex-none p-3.5 rounded-xl bg-white/5 text-red-400 hover:bg-red-500/20 transition-all flex justify-center border border-red-500/10">
                          <X size={20} strokeWidth={3} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditingId(u.id); setNewUsername(u.username); setNewEmail(u.email || ''); setNewRole(u.role); }}
                          className="flex-1 md:flex-none p-3.5 rounded-xl bg-white/5 text-[#87BAC3] hover:text-[#D6F4ED] hover:bg-white/10 transition-all flex justify-center border border-white/5"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDeleteUser(u.id)} className="flex-1 md:flex-none p-3.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all flex justify-center border border-red-500/10">
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
