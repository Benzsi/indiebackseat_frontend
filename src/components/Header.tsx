import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Filter, X, Menu } from 'lucide-react';

interface HeaderProps {
  isAuthenticated: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  isFilterOpen: boolean;
  onToggleFilter: () => void;
  onResetDashboard: () => void;
}

export function Header({ isAuthenticated, searchQuery, onSearchChange, isFilterOpen, onToggleFilter, onResetDashboard }: HeaderProps) {
  const location = useLocation();
  const isFilterablePage = location.pathname === '/' || location.pathname === '/devlogs';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-[#473472] border-b border-[#53629E]/40 shadow-lg shadow-[#473472]/20 relative z-50">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <nav className="flex items-center h-16 gap-4">

          {/* Logo */}
          <div className="flex-1 flex justify-start">
            <Link
              to="/"
              onClick={() => { onResetDashboard(); onSearchChange(''); }}
              className="flex items-center gap-2 text-[#D6F4ED] font-black text-xl tracking-tight hover:text-[#87BAC3] transition-colors duration-200"
            >
              <img src="/logo.png" alt="indie.backseat" className="h-10 w-auto rounded-lg object-contain" />
              <span className="hidden sm:inline">indie.backseat</span>
            </Link>
          </div>

          {/* Search bar - centered */}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="relative w-full">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#87BAC3] pointer-events-none" />
              <input
                type="text"
                placeholder="Keresés..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-[#53629E]/30 border border-[#53629E]/60 text-[#D6F4ED] placeholder-[#87BAC3] rounded-full pl-10 pr-10 py-2 text-sm outline-none focus:border-[#87BAC3] focus:bg-[#53629E]/50 transition-all duration-200"
              />
              {isFilterablePage && (
                <button
                  onClick={onToggleFilter}
                  title={isFilterOpen ? 'Szűrők bezárása' : 'Szűrők megnyitása'}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 ${
                    isFilterOpen
                      ? 'bg-[#D6F4ED] text-[#473472]'
                      : 'text-[#87BAC3] hover:text-[#D6F4ED]'
                  }`}
                >
                  {isFilterOpen ? <X size={15} /> : <Filter size={15} />}
                </button>
              )}
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="flex-1 hidden md:flex items-center gap-2 justify-end">
            <Link to="/ai-search" className="neon-bubble-wrapper">
              <span className="neon-bubble-inner">AI Keresés</span>
            </Link>
            {isAuthenticated && (
              <Link to="/mylists" className="px-3 py-1.5 rounded-full text-sm font-semibold text-[#D6F4ED] border border-[#53629E] bg-[#53629E]/30 hover:bg-[#53629E]/60 transition-all duration-200">
                Gyűjtemény
              </Link>
            )}
            {isAuthenticated ? (
              <Link to="/profile" className="px-3 py-1.5 rounded-full text-sm font-semibold text-[#D6F4ED] border border-[#53629E] bg-[#53629E]/30 hover:bg-[#53629E]/60 transition-all duration-200">
                Profil
              </Link>
            ) : (
              <>
                <Link to="/login" className="px-3 py-1.5 rounded-full text-sm font-semibold text-[#D6F4ED] border border-[#53629E] bg-[#53629E]/30 hover:bg-[#53629E]/60 transition-all duration-200">
                  Bejelentkezés
                </Link>
                <Link to="/register" className="px-3 py-1.5 rounded-full text-sm font-semibold text-[#473472] bg-[#D6F4ED] hover:bg-[#87BAC3] transition-all duration-200">
                  Regisztráció
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#D6F4ED] hover:bg-[#53629E]/40 transition-colors"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {/* Mobile search bar */}
        <div className="md:hidden pb-3">
          <div className="relative w-full">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#87BAC3] pointer-events-none" />
            <input
              type="text"
              placeholder="Keresés..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#53629E]/30 border border-[#53629E]/60 text-[#D6F4ED] placeholder-[#87BAC3] rounded-full pl-10 pr-10 py-2 text-sm outline-none focus:border-[#87BAC3] transition-all"
            />
            {isFilterablePage && (
              <button
                onClick={onToggleFilter}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                  isFilterOpen ? 'bg-[#D6F4ED] text-[#473472]' : 'text-[#87BAC3]'
                }`}
              >
                {isFilterOpen ? <X size={15} /> : <Filter size={15} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#53629E] border-t border-[#473472]/40 px-4 pb-4 flex flex-col gap-2">
          <Link
            to="/ai-search"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-sm font-bold text-[#473472] bg-[#D6F4ED] text-center mt-3"
          >
            ✨ AI Keresés
          </Link>
          {isAuthenticated && (
            <Link
              to="/mylists"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-[#D6F4ED] bg-[#473472]/50 text-center"
            >
              Gyűjtemény
            </Link>
          )}
          {isAuthenticated ? (
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-[#D6F4ED] bg-[#473472]/50 text-center"
            >
              Profil
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-[#D6F4ED] bg-[#473472]/50 text-center"
              >
                Bejelentkezés
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-bold text-[#473472] bg-[#D6F4ED] text-center"
              >
                Regisztráció
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}




