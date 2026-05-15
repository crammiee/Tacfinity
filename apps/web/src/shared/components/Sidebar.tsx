import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { useLogoutMutation } from '@/features/auth/api';

export function Sidebar() {
  const { user, isLoggedIn } = useAuth();
  const logout = useLogoutMutation();

  return (
    <aside className="hidden md:flex w-56 shrink-0 min-h-screen flex-col border-r border-white/10 bg-black/15 backdrop-blur-md px-2 py-4 sticky top-0 z-10">
      {/* Brand */}
      <Link
        to="/"
        className="font-extrabold text-xl px-3 mb-8 block tracking-tight text-primary hover:opacity-80 transition-opacity"
      >
        Tacfinity
      </Link>

      {/* Main nav */}
      <nav className="flex flex-col gap-1 flex-1">
        <PlayNav />
      </nav>

      {/* Bottom profile / auth area */}
      <div className="flex flex-col gap-1 pt-4 border-t border-border">
        {isLoggedIn && user ? (
          <>
            <Link
              to={`/profile/${user.id}`}
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold uppercase text-accent-foreground shrink-0">
                {user.username[0]}
              </div>
              <span className="text-sm font-medium truncate">{user.username}</span>
            </Link>
            <button
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="text-sm font-medium px-3 py-2 rounded-md transition-colors hover:bg-secondary text-destructive text-left disabled:opacity-50"
            >
              {logout.isPending ? 'Logging out…' : 'Log out'}
            </button>
          </>
        ) : (
          <>
            <NavItem to="/login">Login</NavItem>
            <NavItem to="/register">Sign Up</NavItem>
          </>
        )}
      </div>
    </aside>
  );
}

function PlayNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const isChildActive = location.pathname === '/play/online' || location.pathname === '/play/bot';
  const [open, setOpen] = useState(false);
  const [flyoutTop, setFlyoutTop] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function handleToggle() {
    if (!open && buttonRef.current) {
      setFlyoutTop(buttonRef.current.getBoundingClientRect().top);
    }
    setOpen((o) => !o);
  }

  function goTo(path: string) {
    setOpen(false);
    navigate(path);
  }

  return (
    <div>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={[
          'w-full text-sm font-medium px-3 py-2 rounded-md transition-colors flex items-center justify-between',
          isChildActive || open
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        ].join(' ')}
      >
        <span>Play</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 ml-2 w-36 rounded-md border border-border bg-popover shadow-md py-1 px-1"
            style={{ left: '14rem', top: flyoutTop }}
          >
            <button
              onClick={() => goTo('/play/online')}
              className="w-full text-left text-sm font-medium px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors rounded-sm"
            >
              Ranked
            </button>
            <button
              onClick={() => goTo('/play/bot')}
              className="w-full text-left text-sm font-medium px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors rounded-sm"
            >
              vs Bot
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = to !== '#' && location.pathname === to;

  return (
    <Link
      to={to}
      className={[
        'relative text-sm font-medium px-3 py-2 rounded-md transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4/5 before:w-0.5 before:rounded-full before:bg-primary'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
      ].join(' ')}
    >
      {children}
    </Link>
  );
}
