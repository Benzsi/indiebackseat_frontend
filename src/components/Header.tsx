import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

interface HeaderProps {
  isAuthenticated: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function Header({ isAuthenticated, searchQuery, onSearchChange }: HeaderProps) {
  return (
    <header className="header" style={{ justifyContent: 'center' }}>
      <nav className="navbar" style={{ width: '100%', maxWidth: '1200px' }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          <Link to="/" className="header-logo" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <img src="/logo.png" alt="indie.backseat" style={{ height: 48, objectFit: 'contain', borderRadius: 8, marginRight: 8 }} />
              indie.backseat
            </span>
          </Link>
        </div>

        <div style={{ flex: '0 1 auto', display: 'flex', justifyContent: 'center' }}>
          <div className="navbar-search-inline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '420px', maxWidth: '100%' }}>
              <Search
                size={18}
                strokeWidth={2.5}
                color="#94a3b8"
                style={{ position: 'absolute', left: '16px', pointerEvents: 'none' }}
              />
              <input
                type="text"
                placeholder="Keresés.."
                className="navbar-search-input"
                style={{ paddingLeft: '44px', width: '100%', margin: 0 }}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
          <Link to="/ai-search" className="neon-bubble-wrapper">
            <span className="neon-bubble-inner">AI Keresés</span>
          </Link>
          {isAuthenticated && (
            <Link to="/mylists" className="navbar-link">
              Gyűjtemény
            </Link>
          )}
          {isAuthenticated ? (
            <Link to="/profile" className="navbar-link">
              Profil
            </Link>
          ) : (
            <>
              <Link to="/login" className="navbar-link">
                Bejelentkezés
              </Link>
              <Link to="/register" className="navbar-link">
                Regisztráció
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
