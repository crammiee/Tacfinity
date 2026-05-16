import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { ToastItem } from '@/shared/components/ToastItem';

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
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <ToastItem
        message="App saved — bot game works offline"
        tone="success"
        onDismiss={() => setDismissed(true)}
      />
    </div>
  );
}
