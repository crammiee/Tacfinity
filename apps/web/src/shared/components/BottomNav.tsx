import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { useLogoutMutation } from '@/features/auth/api';

export function BottomNav() {
  const { user, isLoggedIn } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const logout = useLogoutMutation();
  const location = useLocation();

  function isActive(path: string) {
    return path !== '#' && location.pathname === path;
  }

  return (
    <>
      {/* Backdrop */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 md:hidden" onClick={() => setMenuOpen(false)} />
      )}

      {/* Profile / auth drawer */}
      {menuOpen && (
        <div className="fixed bottom-16 left-0 right-0 z-40 md:hidden glass border-t border-white/10 shadow-lg px-4 py-3 flex flex-col gap-1">
          {isLoggedIn && user ? (
            <>
              {/* User info row */}
              <div className="flex items-center gap-2 px-2 py-2 border-b border-border mb-1">
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold uppercase text-accent-foreground shrink-0">
                  {user.username[0]}
                </div>
                <span className="text-sm font-medium">{user.username}</span>
              </div>
              {/* Logout always visible in drawer */}
              <button
                onClick={() => {
                  logout.mutate();
                  setMenuOpen(false);
                }}
                disabled={logout.isPending}
                className="text-sm font-medium px-3 py-2 rounded-md text-destructive hover:bg-secondary text-left disabled:opacity-50 transition-colors"
              >
                {logout.isPending ? 'Logging out…' : 'Log out'}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium px-3 py-2 rounded-md hover:bg-secondary transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium px-3 py-2 rounded-md hover:bg-secondary transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}

      {/* Bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden glass border-t border-white/10 flex items-center justify-around h-16">
        <NavIcon to="/" label="Home" active={isActive('/')}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </NavIcon>

        <NavIcon to="/play/online" label="Play" active={isActive('/play/online')}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </NavIcon>

        <button
          onClick={() => setMenuOpen((o) => !o)}
          className={`flex flex-col items-center gap-0.5 text-xs px-3 py-1 transition-colors ${
            menuOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          <span>Profile</span>
        </button>
      </nav>
    </>
  );
}

function NavIcon({
  to,
  label,
  active,
  children,
}: {
  to: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`relative flex flex-col items-center gap-0.5 text-xs px-3 py-1 transition-colors ${
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {/* Active indicator dot above label */}
      {active && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px w-1 h-1 rounded-full bg-primary" />
      )}
      {children}
      <span>{label}</span>
    </Link>
  );
}
