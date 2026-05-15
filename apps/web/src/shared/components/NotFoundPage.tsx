import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-6">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="text-lg font-medium">Page not found.</p>
      <p className="text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Button asChild>
        <Link to="/">Go home</Link>
      </Button>
    </div>
  );
}
