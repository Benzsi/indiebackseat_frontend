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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-[#473472] rounded-3xl border border-[#53629E] shadow-2xl overflow-hidden">
          {/* Header strip */}
          <div className="h-1 w-full bg-gradient-to-r from-[#87BAC3] to-[#D6F4ED]" />

          <div className="p-8 sm:p-10">
            {/* Back link */}
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[#87BAC3] hover:text-[#D6F4ED] text-sm font-semibold mb-8 transition-colors duration-200"
            >
              <ArrowLeft size={16} /> Vissza a főoldalra
            </Link>

            {/* Title */}
            <div className="mb-8">
              <div className="w-12 h-12 rounded-2xl bg-[#D6F4ED]/10 border border-[#D6F4ED]/20 flex items-center justify-center mb-4">
                <LogIn size={24} className="text-[#87BAC3]" />
              </div>
              <h1 className="text-3xl font-black text-[#D6F4ED] tracking-tight">Bejelentkezés</h1>
              <p className="text-[#87BAC3] mt-1 text-sm">Üdv vissza! Add meg az adataidat.</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/20 border border-red-400/40 text-red-300 text-sm font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Username field */}
              <div className="flex flex-col gap-2">
                <label htmlFor="login-username" className="text-xs font-bold text-[#87BAC3] uppercase tracking-widest flex items-center gap-1.5">
                  <User size={12} /> Felhasználónév vagy Email
                </label>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Felhasználónév vagy email cím"
                  disabled={loading}
                  className="bg-[#53629E]/30 border border-[#53629E] text-[#D6F4ED] placeholder-[#87BAC3]/60 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#87BAC3] focus:bg-[#53629E]/50 transition-all disabled:opacity-50"
                />
              </div>

              {/* Password field */}
              <div className="flex flex-col gap-2">
                <label htmlFor="login-password" className="text-xs font-bold text-[#87BAC3] uppercase tracking-widest flex items-center gap-1.5">
                  <Lock size={12} /> Jelszó
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Jelszó"
                  disabled={loading}
                  className="bg-[#53629E]/30 border border-[#53629E] text-[#D6F4ED] placeholder-[#87BAC3]/60 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#87BAC3] focus:bg-[#53629E]/50 transition-all disabled:opacity-50"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-3 rounded-xl bg-[#D6F4ED] text-[#473472] font-black text-sm hover:bg-[#87BAC3] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#D6F4ED]/10"
              >
                {loading ? 'Bejelentkezés...' : 'Bejelentkezés →'}
              </button>
            </form>

            {/* Footer link */}
            <p className="mt-6 text-center text-sm text-[#87BAC3]">
              Még nincs fiókod?{' '}
              <Link to="/register" className="text-[#D6F4ED] font-bold hover:text-[#87BAC3] transition-colors">
                Regisztrálj itt
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}