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

  const inputClass = "bg-[#53629E]/30 border border-[#53629E] text-[#D6F4ED] placeholder-[#87BAC3]/60 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#87BAC3] transition-all w-full";
  const selectClass = "bg-[#473472] border border-[#53629E] text-[#D6F4ED] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#87BAC3] transition-all cursor-pointer w-full";

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
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header row */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-[#D6F4ED] border border-[#53629E] bg-[#53629E]/30 hover:bg-[#53629E]/60 transition-all">
          <ArrowLeft size={16} /> Vissza
        </Link>
        <h1 className="flex items-center gap-3 text-xl sm:text-2xl font-black text-[#473472]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#473472] to-[#53629E] flex items-center justify-center">
            <UserIcon size={20} className="text-[#D6F4ED]" />
          </div>
          Felhasználók kezelése
        </h1>
        <Link to="/profile" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-[#D6F4ED] bg-[#473472] hover:bg-[#53629E] transition-all">
          <UserCog size={16} /> Profilom
        </Link>
      </div>

      {/* Main card */}
      <div className="bg-[#473472] rounded-3xl border border-[#53629E] shadow-2xl overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#87BAC3] to-[#D6F4ED]" />

        {/* Control bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap px-6 py-5 border-b border-[#53629E]/40 bg-[#53629E]/10">
          <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                showCreateForm
                  ? 'bg-red-500/20 text-red-400 border border-red-400/40 hover:bg-red-500/30'
                  : 'bg-[#D6F4ED] text-[#473472] hover:bg-[#87BAC3]'
              }`}
            >
              {showCreateForm ? <><X size={16} /> Mégse</> : <><UserPlus size={16} /> Új felhasználó</>}
            </button>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#87BAC3] border border-[#53629E] bg-[#53629E]/20 hover:bg-[#53629E]/40 transition-all disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Frissítés
            </button>
          </div>
          <span className="text-[#87BAC3] text-xs font-black uppercase tracking-widest bg-[#53629E]/20 px-3 py-1 rounded-full">{users.length} Fő</span>
        </div>

        <div className="p-4 sm:p-8">
          {/* Alerts */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/20 border border-red-400/40 text-red-300 text-sm font-semibold animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-sm font-semibold animate-in fade-in slide-in-from-top-2">
              {success}
            </div>
          )}

          {/* Create form */}
          {showCreateForm && (
            <div className="mb-8 bg-[#53629E]/20 border border-[#53629E]/40 rounded-3xl p-6 md:p-8 animate-in zoom-in-95 duration-300">
              <h2 className="text-xl font-black text-[#D6F4ED] mb-6 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#D6F4ED] text-[#473472]">
                  <UserPlus size={20} />
                </div>
                Új felhasználó <span className="text-[#87BAC3]">regisztrálása</span>
              </h2>
              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-[#87BAC3] uppercase tracking-[0.2em] ml-1">Felhasználónév</label>
                  <input type="text" value={createUsername} onChange={(e) => setCreateUsername(e.target.value)} placeholder="Pl. AdminElek" className={inputClass} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-[#87BAC3] uppercase tracking-[0.2em] ml-1">Email cím</label>
                  <input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder="pelda@email.com" className={inputClass} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-[#87BAC3] uppercase tracking-[0.2em] ml-1 flex items-center gap-1">Jelszó</label>
                  <input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} placeholder="••••••••" className={inputClass} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-[#87BAC3] uppercase tracking-[0.2em] ml-1">Szerepkör</label>
                  <select value={createRole} onChange={(e) => setCreateRole(e.target.value as any)} className={selectClass}>
                    <option value="USER" className="bg-[#473472]">Felhasználó</option>
                    <option value="ADMIN" className="bg-[#473472]">Adminisztrátor</option>
                    <option value="DEVELOPER" className="bg-[#473472]">Fejlesztő</option>
                  </select>
                </div>
                <button type="submit" className="md:col-span-full lg:col-span-full py-4 rounded-2xl bg-[#D6F4ED] text-[#473472] font-black text-base hover:bg-[#87BAC3] transition-all shadow-lg shadow-[#D6F4ED]/10 mt-2">
                  Fiók létrehozása
                </button>
              </form>
            </div>
          )}

          {/* User List - Mobile Cards / Desktop Table */}
          <div className="space-y-4">
            {/* Desktop Header (hidden on mobile) */}
            <div className="hidden md:grid grid-cols-[80px_1fr_180px_140px_120px] gap-4 px-6 py-4 bg-[#53629E]/30 rounded-2xl mb-4 border border-[#53629E]/20">
              <span className="text-[10px] font-black text-[#87BAC3] uppercase tracking-widest">ID</span>
              <span className="text-[10px] font-black text-[#87BAC3] uppercase tracking-widest">Adatok</span>
              <span className="text-[10px] font-black text-[#87BAC3] uppercase tracking-widest">Szerepkör</span>
              <span className="text-[10px] font-black text-[#87BAC3] uppercase tracking-widest">Dátum</span>
              <span className="text-[10px] font-black text-[#87BAC3] uppercase tracking-widest text-right">Művelet</span>
            </div>

            {loading ? (
              <div className="py-20 text-center text-[#87BAC3] font-bold animate-pulse uppercase tracking-[0.2em]">Adatok szinkronizálása...</div>
            ) : users.length === 0 ? (
              <div className="py-12 text-center text-[#87BAC3] text-sm italic">Nincs megjeleníthető felhasználó.</div>
            ) : (
              users.map((u) => (
                <div 
                  key={u.id}
                  className={`relative flex flex-col md:grid md:grid-cols-[80px_1fr_180px_140px_120px] md:items-center gap-4 p-5 md:px-6 md:py-4 bg-[#53629E]/10 border border-[#53629E]/20 rounded-2xl hover:bg-[#53629E]/20 transition-all ${editingId === u.id ? 'ring-2 ring-[#87BAC3] bg-[#53629E]/30' : ''}`}
                >
                  {/* ID - Mobile only as badge */}
                  <div className="md:text-sm font-black text-[#87BAC3]/60">
                    <span className="md:hidden text-[10px] uppercase font-bold mr-2">ID:</span>
                    #{u.id}
                  </div>

                  {/* Info */}
                  <div className="flex flex-col min-w-0">
                    {editingId === u.id ? (
                      <div className="flex flex-col gap-2 w-full pr-2">
                        <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Név" className={inputClass} />
                        <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email" className={inputClass} />
                      </div>
                    ) : (
                      <>
                        <span className="text-base font-black text-[#D6F4ED] truncate uppercase tracking-tight">{u.username}</span>
                        <span className="text-xs text-[#87BAC3] truncate font-medium">{u.email || 'Nincs megadva'}</span>
                      </>
                    )}
                  </div>

                  {/* Role */}
                  <div className="flex items-center">
                    {editingId === u.id ? (
                      <select value={newRole} onChange={(e) => setNewRole(e.target.value as any)} className={selectClass}>
                        <option value="USER" className="bg-[#473472]">Felhasználó</option>
                        <option value="ADMIN" className="bg-[#473472]">Admin</option>
                        <option value="DEVELOPER" className="bg-[#473472]">Fejlesztő</option>
                      </select>
                    ) : roleBadge(u.role)}
                  </div>

                  {/* Date */}
                  <div className="text-xs font-bold text-[#87BAC3] md:block">
                    <span className="md:hidden uppercase text-[9px] mr-2 block mb-1">Regisztrálva:</span>
                    {new Date(u.createdAt).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 justify-end pt-4 md:pt-0 border-t md:border-none border-[#53629E]/20">
                    {editingId === u.id ? (
                      <>
                        <button onClick={() => handleUpdateUser(u.id)} className="flex-1 md:flex-none p-3 rounded-xl bg-[#D6F4ED] text-[#473472] hover:bg-[#87BAC3] transition-all flex justify-center">
                          <Check size={18} strokeWidth={3} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="flex-1 md:flex-none p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all flex justify-center">
                          <X size={18} strokeWidth={3} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditingId(u.id); setNewUsername(u.username); setNewEmail(u.email || ''); setNewRole(u.role); }}
                          className="flex-1 md:flex-none p-3 rounded-xl bg-[#53629E]/40 text-[#87BAC3] hover:text-[#D6F4ED] hover:bg-[#53629E] transition-all flex justify-center"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteUser(u.id)} className="flex-1 md:flex-none p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all flex justify-center">
                          <Trash2 size={16} />
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
