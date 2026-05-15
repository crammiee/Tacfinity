import { useEffect, useState } from 'react';
import { useAuthStore } from '@/features/auth/store';

export function WakeupScreen() {
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const [showWakeup, setShowWakeup] = useState(false);

  useEffect(() => {
    if (!isBootstrapping) return;
    const t = setTimeout(() => setShowWakeup(true), 2000);
    return () => clearTimeout(t);
  }, [isBootstrapping]);

  if (!isBootstrapping) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      <div className="glass rounded-2xl px-10 py-12 flex flex-col items-center gap-6 max-w-sm w-full mx-4 text-center">
        <span className="text-2xl font-extrabold tracking-tight text-primary">Tacfinity</span>

        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />

        <div className="flex flex-col gap-1.5">
          <p className="text-sm text-foreground font-medium">
            {showWakeup ? 'API is waking up…' : 'Loading…'}
          </p>
          {showWakeup && (
            <p className="text-xs text-muted-foreground">This usually takes under a minute.</p>
          )}
        </div>
      </div>
    </div>
  );
}
