import { useToastStore } from '@/shared/lib/toast';
import { ToastItem } from '@/shared/components/ToastItem';

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} message={t.message} tone={t.tone} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}
