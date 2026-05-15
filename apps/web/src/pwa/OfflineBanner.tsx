import { WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOfflineStatus } from './useOfflineStatus';

export function OfflineBanner() {
  const { isOnline } = useOfflineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full bg-black/60 backdrop-blur-md border border-primary/30 text-sm shadow-lg shadow-black/40 whitespace-nowrap">
      <WifiOff className="size-4 shrink-0 text-primary" />
      <span className="text-foreground">You're offline — matchmaking unavailable.</span>
      <Link
        to="/play/bot"
        className="font-semibold text-primary hover:opacity-80 transition-opacity"
      >
        Play vs Bot →
      </Link>
    </div>
  );
}
