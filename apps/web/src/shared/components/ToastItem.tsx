import { CheckCircle, Info, X, XCircle } from 'lucide-react';

const icons = {
  success: <CheckCircle className="size-4 shrink-0 text-primary" />,
  info: <Info className="size-4 shrink-0 text-blue-400" />,
  error: <XCircle className="size-4 shrink-0 text-destructive" />,
};

interface Props {
  message: string;
  tone?: 'success' | 'info' | 'error';
  onDismiss: () => void;
}

export function ToastItem({ message, tone = 'info', onDismiss }: Props) {
  return (
    <div className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-full bg-black/60 backdrop-blur-md border border-primary/30 text-sm shadow-lg shadow-black/40 whitespace-nowrap">
      {icons[tone]}
      <span className="text-foreground">{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-muted-foreground hover:text-foreground transition-colors ml-1"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
