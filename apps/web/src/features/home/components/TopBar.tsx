import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';

export function TopBar() {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between px-8 py-3 border-b shrink-0">
      <Link
        to={`/profile/${user?.id}`}
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold uppercase">
          {user?.username?.[0]}
        </div>
        <span className="font-medium">{user?.username}</span>
      </Link>
      <span className="text-sm text-muted-foreground">
        ♟ <span className="font-semibold text-foreground">1 000</span> ELO
      </span>
    </header>
  );
}
