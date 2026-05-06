import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { useLogoutMutation } from '@/features/auth/api';

export function Sidebar() {
  const { user, isLoggedIn } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const logout = useLogoutMutation();

  return (
    <aside className="w-56 shrink-0 min-h-screen flex flex-col border-r bg-background px-2 py-4">
      <Link to="/" className="font-bold text-lg px-3 mb-8 block">
        Tacfinity
      </Link>

      <nav className="flex flex-col gap-1 flex-1">
        <NavItem to="/play/online">Play</NavItem>
        <NavItem to="#">Watch</NavItem>
        <NavItem to="#">Community</NavItem>
        <NavItem to="#">Others</NavItem>
      </nav>

      <div className="flex flex-col gap-1 pt-4 border-t">
        {isLoggedIn && user ? (
          <>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="text-sm font-medium px-3 py-2 rounded-md transition-colors hover:bg-accent text-foreground text-left"
            >
              {user.username}
            </button>
            {menuOpen && (
              <button
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className="text-sm font-medium px-3 py-2 rounded-md transition-colors hover:bg-accent text-destructive text-left disabled:opacity-50"
              >
                {logout.isPending ? 'Logging out…' : 'Log out'}
              </button>
            )}
          </>
        ) : (
          <>
            <NavItem to="#">Search</NavItem>
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
      className={`text-sm font-medium px-3 py-2 rounded-md transition-colors hover:bg-accent ${
        isActive ? 'bg-accent text-accent-foreground' : 'text-foreground'
      }`}
    >
      {children}
    </Link>
  );
}
