import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/api';
import { Lock, User, Mail, ArrowLeft, UserPlus } from 'lucide-react';

interface RegisterProps {
  onRegisterSuccess: (user: any) => void;
}

export function Register({ onRegisterSuccess }: RegisterProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const authService = new AuthService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('A jelszavak nem egyeznek!');
      return;
    }
    if (password.length < 4 || password.length > 64) {
      setError('A jelszó 4-64 karakter közötti kell legyen');
      return;
    }
    if (username.length < 3 || username.length > 32) {
      setError('A felhasználónév 3-32 karakter közötti kell legyen');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Kérlek adj meg egy érvényes email címet');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.register({ username, email, password });
      if (result.token) {
        localStorage.setItem('authToken', result.token);
      }
      onRegisterSuccess(result.user);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Regisztráció sikertelen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="glass-auth-card relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#D6F4ED] via-[#87BAC3] to-[#D6F4ED]" />

          <div className="p-10 sm:p-12">
            <Link to="/" className="inline-flex items-center gap-2 group mb-10 text-xs font-black uppercase tracking-widest text-[#87BAC3] hover:text-[#D6F4ED] transition-all">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Vissza a kezdőlapra
            </Link>

            <div className="mb-10 text-center sm:text-left">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#473472] to-[#53629E] flex items-center justify-center mb-6 shadow-xl border border-white/5 mx-auto sm:mx-0">
                <UserPlus size={28} className="text-[#D6F4ED]" />
              </div>
              <h1 className="text-4xl font-black text-[#D6F4ED] tracking-tighter uppercase mb-2">Csatlakozás</h1>
              <p className="text-sm font-bold text-[#87BAC3] uppercase tracking-widest opacity-60">Indie backstage közösség</p>
            </div>

            {error && (
              <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs uppercase tracking-widest text-center animate-shake">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="glass-label ml-1">Felhasználónév</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#87BAC3] group-focus-within:text-[#D6F4ED] transition-colors" size={18} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Hogy hívjunk?"
                    disabled={loading}
                    className="glass-input !pl-12 !py-3.5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="glass-label ml-1">Email cím</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#87BAC3] group-focus-within:text-[#D6F4ED] transition-colors" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="pelda@email.com"
                    disabled={loading}
                    className="glass-input !pl-12 !py-3.5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="glass-label ml-1">Jelszó</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#87BAC3] group-focus-within:text-[#D6F4ED] transition-colors" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Válassz egy erőt..."
                    disabled={loading}
                    className="glass-input !pl-12 !py-3.5"
                  />
                </div>
              </div>

              <div className="space-y-2 pb-2">
                <label className="glass-label ml-1">Megerősítés</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#87BAC3] group-focus-within:text-[#D6F4ED] transition-colors" size={18} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Jelszó még egyszer"
                    disabled={loading}
                    className="glass-input !pl-12 !py-3.5"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="primary-btn-pill w-full !py-4 group"
              >
                {loading ? 'Profil létrehozása...' : 'Regisztráció végrehajtása'}
                {!loading && <UserPlus size={18} className="ml-2 group-hover:translate-x-1 transition-transform" /> }
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-white/5 text-center">
              <p className="text-sm font-bold text-[#87BAC3] uppercase tracking-widest opacity-60 mb-4">Van már profilod?</p>
              <Link to="/login" className="inline-block px-10 py-3 rounded-xl bg-white/5 border border-white/10 text-[#D6F4ED] font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
                Bejelentkezés
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
