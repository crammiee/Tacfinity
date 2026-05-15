import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { useLogoutMutation } from '@/features/auth/api';

export function BottomNav() {
  const { user, isLoggedIn } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [playOpen, setPlayOpen] = useState(false);
  const logout = useLogoutMutation();
  const location = useLocation();

  function isActive(path: string) {
    return path !== '#' && location.pathname === path;
  }

  const isPlayActive = location.pathname.startsWith('/play');

  function closeAll() {
    setProfileOpen(false);
    setPlayOpen(false);
  }

  return (
    <>
      {/* Backdrop */}
      {(profileOpen || playOpen) && (
        <div className="fixed inset-0 z-30 md:hidden" onClick={closeAll} />
      )}

      {/* Play drawer */}
      {playOpen && (
        <div className="fixed bottom-16 left-0 right-0 z-40 md:hidden glass border-t border-white/10 shadow-lg px-4 py-3 flex flex-col gap-1">
          <Link
            to="/play/online"
            onClick={closeAll}
            className="text-sm font-medium px-3 py-2 rounded-md hover:bg-secondary transition-colors"
          >
            Ranked
          </Link>
          <Link
            to="/play/bot"
            onClick={closeAll}
            className="text-sm font-medium px-3 py-2 rounded-md hover:bg-secondary transition-colors"
          >
            vs Bot
          </Link>
        </div>
      )}

      {/* Profile / auth drawer */}
      {profileOpen && (
        <div className="fixed bottom-16 left-0 right-0 z-40 md:hidden glass border-t border-white/10 shadow-lg px-4 py-3 flex flex-col gap-1">
          {isLoggedIn && user ? (
            <>
              <div className="flex items-center gap-2 px-2 py-2 border-b border-border mb-1">
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold uppercase text-accent-foreground shrink-0">
                  {user.username[0]}
                </div>
                <span className="text-sm font-medium">{user.username}</span>
              </div>
              <button
                onClick={() => {
                  logout.mutate();
                  closeAll();
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
                onClick={closeAll}
                className="text-sm font-medium px-3 py-2 rounded-md hover:bg-secondary transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={closeAll}
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

        <button
          onClick={() => {
            setPlayOpen((o) => !o);
            setProfileOpen(false);
          }}
          className={`relative flex flex-col items-center gap-0.5 text-xs px-3 py-1 transition-colors ${
            isPlayActive || playOpen
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {isPlayActive && !playOpen && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px w-1 h-1 rounded-full bg-primary" />
          )}
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
          <span>Play</span>
        </button>

        <button
          onClick={() => {
            setProfileOpen((o) => !o);
            setPlayOpen(false);
          }}
          className={`flex flex-col items-center gap-0.5 text-xs px-3 py-1 transition-colors ${
            profileOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
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
