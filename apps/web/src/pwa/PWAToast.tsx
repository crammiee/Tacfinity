import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { CheckCircle, X } from 'lucide-react';

export function PWAToast() {
  const {
    offlineReady: [isOfflineReady],
  } = useRegisterSW();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isOfflineReady) return;
    const t = setTimeout(() => setDismissed(true), 5000);
    return () => clearTimeout(t);
  }, [isOfflineReady]);

  if (!isOfflineReady || dismissed) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full bg-black/60 backdrop-blur-md border border-primary/30 text-sm shadow-lg shadow-black/40 whitespace-nowrap">
      <CheckCircle className="size-4 shrink-0 text-primary" />
      <span className="text-foreground">App saved — bot game works offline</span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="text-muted-foreground hover:text-foreground transition-colors ml-1"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
