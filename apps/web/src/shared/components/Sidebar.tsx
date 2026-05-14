import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { useLogoutMutation } from '@/features/auth/api';

export function Sidebar() {
  const { user, isLoggedIn } = useAuth();
  const logout = useLogoutMutation();

  return (
    <aside className="hidden md:flex w-56 shrink-0 min-h-screen flex-col border-r border-white/10 bg-black/15 backdrop-blur-md px-2 py-4 sticky top-0">
      {/* Brand */}
      <Link
        to="/"
        className="font-extrabold text-xl px-3 mb-8 block tracking-tight text-primary hover:opacity-80 transition-opacity"
      >
        Tacfinity
      </Link>

      {/* Main nav */}
      <nav className="flex flex-col gap-1 flex-1">
        <NavItem to="/play/online">Play</NavItem>
        <NavItem to="#">Watch</NavItem>
        <NavItem to="#">Community</NavItem>
        <NavItem to="#">Others</NavItem>
      </nav>

      {/* Bottom profile / auth area */}
      <div className="flex flex-col gap-1 pt-4 border-t border-border">
        {isLoggedIn && user ? (
          <>
            {/* Avatar + username row */}
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold uppercase text-accent-foreground shrink-0">
                {user.username[0]}
              </div>
              <span className="text-sm font-medium truncate">{user.username}</span>
            </div>
            {/* Logout always visible */}
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
