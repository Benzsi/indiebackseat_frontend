import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/api';
import { Lock, User, ArrowLeft, LogIn } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const authService = new AuthService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.login({ username, password });
      if (result.token) {
        localStorage.setItem('authToken', result.token);
      }
      onLoginSuccess(result.user);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bejelentkezés sikertelen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        {/* Card */}
        <div className="glass-auth-card relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#87BAC3] via-[#D6F4ED] to-[#87BAC3]" />

          <div className="p-10 sm:p-12">
            {/* Back link */}
            <Link to="/" className="inline-flex items-center gap-2 group mb-10 text-xs font-black uppercase tracking-widest text-[#87BAC3] hover:text-[#D6F4ED] transition-all">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Vissza a kezdőlapra
            </Link>

            {/* Title */}
            <div className="mb-10 text-center sm:text-left">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#473472] to-[#53629E] flex items-center justify-center mb-6 shadow-xl border border-white/5 mx-auto sm:mx-0">
                <LogIn size={28} className="text-[#D6F4ED]" />
              </div>
              <h1 className="text-4xl font-black text-[#D6F4ED] tracking-tighter uppercase mb-2">Bejelentkezés</h1>
              <p className="text-sm font-bold text-[#87BAC3] uppercase tracking-widest opacity-60">Üdvözlünk újra a platformon!</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs uppercase tracking-widest text-center animate-shake">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="glass-label ml-1">Felhasználónév</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#87BAC3] group-focus-within:text-[#D6F4ED] transition-colors" size={18} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Írd be a neved..."
                    disabled={loading}
                    className="glass-input !pl-12 !py-4"
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
                    placeholder="••••••••"
                    disabled={loading}
                    className="glass-input !pl-12 !py-4"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="primary-btn-pill w-full !py-4 !text-base group"
              >
                {loading ? 'Hitelesítés...' : 'Bejelentkezés'}
                {!loading && <LogIn size={18} className="ml-2 group-hover:translate-x-1 transition-transform" /> }
              </button>
            </form>

            {/* Footer link */}
            <div className="mt-10 pt-10 border-t border-white/5 text-center">
              <p className="text-sm font-bold text-[#87BAC3] uppercase tracking-widest opacity-60 mb-4">Még nincs profilod?</p>
              <Link to="/register" className="inline-block px-10 py-3 rounded-xl bg-white/5 border border-white/10 text-[#D6F4ED] font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
                Fiók létrehozása
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



