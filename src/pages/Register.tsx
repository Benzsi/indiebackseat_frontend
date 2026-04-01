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

  const inputClass = "bg-[#53629E]/30 border border-[#53629E] text-[#D6F4ED] placeholder-[#87BAC3]/60 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#87BAC3] focus:bg-[#53629E]/50 transition-all disabled:opacity-50";
  const labelClass = "text-xs font-bold text-[#87BAC3] uppercase tracking-widest flex items-center gap-1.5";

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-[#473472] rounded-3xl border border-[#53629E] shadow-2xl overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-[#D6F4ED] to-[#87BAC3]" />

          <div className="p-8 sm:p-10">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[#87BAC3] hover:text-[#D6F4ED] text-sm font-semibold mb-8 transition-colors"
            >
              <ArrowLeft size={16} /> Vissza a főoldalra
            </Link>

            <div className="mb-8">
              <div className="w-12 h-12 rounded-2xl bg-[#D6F4ED]/10 border border-[#D6F4ED]/20 flex items-center justify-center mb-4">
                <UserPlus size={24} className="text-[#87BAC3]" />
              </div>
              <h1 className="text-3xl font-black text-[#D6F4ED] tracking-tight">Regisztráció</h1>
              <p className="text-[#87BAC3] mt-1 text-sm">Csatlakozz az indie.backseat közösséghez!</p>
            </div>

            {error && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/20 border border-red-400/40 text-red-300 text-sm font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="reg-username" className={labelClass}>
                  <User size={12} /> Felhasználónév
                </label>
                <input
                  id="reg-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Felhasználónév (3-32 karakter)"
                  disabled={loading}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="reg-email" className={labelClass}>
                  <Mail size={12} /> Email cím
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="pelda@email.com"
                  disabled={loading}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="reg-password" className={labelClass}>
                  <Lock size={12} /> Jelszó
                </label>
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Jelszó (4-64 karakter)"
                  disabled={loading}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="reg-confirm" className={labelClass}>
                  <Lock size={12} /> Jelszó megerősítése
                </label>
                <input
                  id="reg-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Jelszó megerősítése"
                  disabled={loading}
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-3 rounded-xl bg-[#D6F4ED] text-[#473472] font-black text-sm hover:bg-[#87BAC3] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Regisztráció...' : 'Fiók létrehozása →'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#87BAC3]">
              Van már fiókod?{' '}
              <Link to="/login" className="text-[#D6F4ED] font-bold hover:text-[#87BAC3] transition-colors">
                Lépj be itt
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
